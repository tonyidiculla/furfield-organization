import 'dotenv/config'

import crypto from 'node:crypto'
import { promises as dns } from 'node:dns'
import { promises as fs } from 'node:fs'

import { Client as PgClient } from 'pg'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { PNG } from 'pngjs'

type ProfileRow = {
    id: string
    email: string | null
    first_name: string | null
    last_name: string | null
    icon_storage: Record<string, unknown> | null
}

type IconStorage = {
    bucket: string
    path: string
    public_url: string
    uploaded_at: string
    generator: string
    source_seed: string
}

const BUCKET_NAME = 'profile-icons'
const ICON_GENERATOR = 'gradient-v1'

function assertEnv(value: string | undefined, name: string): string {
    if (!value) {
        throw new Error(`Missing required environment variable: ${name}`)
    }

    return value
}

function createStorageClient(): SupabaseClient {
    const url = assertEnv(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL')
    const serviceRoleKey = assertEnv(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY')

    return createClient(url, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
    })
}

async function resolvePoolerUrl(password: string): Promise<URL | null> {
    try {
        const fileUrl = new URL('../supabase/.temp/pooler-url', import.meta.url)
        const raw = await fs.readFile(fileUrl, 'utf8')
        const trimmed = raw.trim()

        if (!trimmed) {
            return null
        }

        const hydrated = trimmed.replace('[YOUR-PASSWORD]', encodeURIComponent(password))
        return new URL(hydrated)
    } catch {
        return null
    }
}

async function resolveHost(hostname: string): Promise<string> {
    try {
        const { address } = await dns.lookup(hostname, { family: 4 })
        return address
    } catch (error) {
        const code = (error as NodeJS.ErrnoException)?.code
        if (code && ['ENOTFOUND', 'EAI_AGAIN'].includes(code)) {
            return hostname
        }

        throw error
    }
}

async function createPgClient(): Promise<PgClient> {
    const connectionString = assertEnv(process.env.DATABASE_URL, 'DATABASE_URL')
    const primaryUrl = new URL(connectionString)
    const poolerUrl = await resolvePoolerUrl(primaryUrl.password)
    const targetUrl = poolerUrl ?? primaryUrl

    const host = await resolveHost(targetUrl.hostname)

    const client = new PgClient({
        host,
        port: Number(targetUrl.port || '5432'),
        user: decodeURIComponent(targetUrl.username),
        password: decodeURIComponent(targetUrl.password),
        database: targetUrl.pathname.replace(/^\//, ''),
        keepAlive: true,
        application_name: 'profile-icon-uploader',
        ssl: {
            rejectUnauthorized: false,
        },
    })

    await client.connect()
    return client
}

async function ensureBucket(client: SupabaseClient) {
    const { data: buckets, error } = await client.storage.listBuckets()

    if (error) {
        throw error
    }

    const hasBucket = buckets?.some((bucket) => bucket.name === BUCKET_NAME)

    if (!hasBucket) {
        const { error: createError } = await client.storage.createBucket(BUCKET_NAME, {
            public: true,
            fileSizeLimit: 5 * 1024 * 1024,
        })

        if (createError) {
            throw createError
        }

        console.log(`Created storage bucket "${BUCKET_NAME}"`)
    }
}

function parseIconStorage(raw: unknown): Record<string, unknown> | null {
    if (!raw) {
        return null
    }

    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw) as Record<string, unknown>
        } catch (error) {
            console.warn('Unable to parse icon_storage JSON:', error)
            return null
        }
    }

    if (typeof raw === 'object') {
        return raw as Record<string, unknown>
    }

    return null
}

async function loadProfiles(pgClient: PgClient): Promise<ProfileRow[]> {
    const result = await pgClient.query<ProfileRow>(
        'SELECT id, email, first_name, last_name, icon_storage FROM master_data.profiles',
    )

    return result.rows.map((row) => ({
        ...row,
        icon_storage: parseIconStorage(row.icon_storage),
    }))
}

function hasExistingIcon(iconStorage: ProfileRow['icon_storage']): boolean {
    if (!iconStorage || typeof iconStorage !== 'object') {
        return false
    }

    const bucket = iconStorage.bucket
    const path = iconStorage.path
    const publicUrl = iconStorage.public_url

    return Boolean(bucket && path && publicUrl)
}

function normaliseSeed(profile: ProfileRow): string {
    const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ').trim()
    if (name) {
        return name
    }

    if (profile.email) {
        const [localPart] = profile.email.split('@')
        return localPart
    }

    return profile.id
}

function computeFilePath(profile: ProfileRow): string {
    return `${profile.id}.png`
}

function createGradientAvatar(seed: string, size = 256): Buffer {
    const png = new PNG({ width: size, height: size })
    const hash = crypto.createHash('sha256').update(seed).digest()
    const colorA = hash.subarray(0, 3)
    const colorB = hash.subarray(3, 6)
    const accent = hash.subarray(6, 9)

    for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
            const idx = (size * y + x) << 2
            const mix = (x + y) / (2 * (size - 1))
            const accentMix = (Math.sin((x / size) * Math.PI * 2) + 1) / 2

            png.data[idx] = Math.round(colorA[0] * (1 - mix) + colorB[0] * mix)
            png.data[idx + 1] = Math.round(colorA[1] * (1 - mix) + colorB[1] * mix)
            png.data[idx + 2] = Math.round(colorA[2] * (1 - mix) + colorB[2] * mix)

            const highlightStrength = accentMix * 0.25
            png.data[idx] = Math.min(255, png.data[idx] + Math.round(accent[0] * highlightStrength))
            png.data[idx + 1] = Math.min(255, png.data[idx + 1] + Math.round(accent[1] * highlightStrength))
            png.data[idx + 2] = Math.min(255, png.data[idx + 2] + Math.round(accent[2] * highlightStrength))

            png.data[idx + 3] = 255
        }
    }

    return PNG.sync.write(png)
}

async function uploadIcon(storageClient: SupabaseClient, profile: ProfileRow): Promise<IconStorage> {
    const seed = normaliseSeed(profile)
    const buffer = createGradientAvatar(seed)
    const filePath = computeFilePath(profile)

    const { error: uploadError } = await storageClient.storage.from(BUCKET_NAME).upload(filePath, buffer, {
        cacheControl: '3600',
        contentType: 'image/png',
        upsert: true,
    })

    if (uploadError) {
        throw uploadError
    }

    const {
        data: { publicUrl },
    } = storageClient.storage.from(BUCKET_NAME).getPublicUrl(filePath)

    const uploadedAt = new Date().toISOString()

    return {
        bucket: BUCKET_NAME,
        path: filePath,
        public_url: publicUrl,
        uploaded_at: uploadedAt,
        generator: ICON_GENERATOR,
        source_seed: seed,
    }
}

async function updateProfileIcon(pgClient: PgClient, profileId: string, iconStorage: IconStorage) {
    const iconJson = JSON.stringify(iconStorage)
    const updatedAt = iconStorage.uploaded_at

    await pgClient.query(
        'UPDATE master_data.profiles SET icon_storage = $1::jsonb, updated_at = $2 WHERE id = $3',
        [iconJson, updatedAt, profileId],
    )
}

async function main() {
    const storageClient = createStorageClient()
    const pgClient = await createPgClient()

    try {
        await ensureBucket(storageClient)

        const profiles = await loadProfiles(pgClient)
        const targets = profiles.filter((profile) => !hasExistingIcon(profile.icon_storage))

        if (targets.length === 0) {
            console.log('All profiles already have icon storage metadata. Nothing to do.')
            return
        }

        console.log(`Preparing icons for ${targets.length} profiles...`)

        for (const profile of targets) {
            try {
                const iconStorage = await uploadIcon(storageClient, profile)
                await updateProfileIcon(pgClient, profile.id, iconStorage)
                console.log(`✓ Updated profile ${profile.id} (${profile.email ?? 'no-email'})`)
            } catch (error) {
                console.error(`✗ Failed to process profile ${profile.id}:`, error)
            }
        }

        console.log('Icon upload process complete.')
    } finally {
        await pgClient.end()
    }
}

main().catch((error) => {
    console.error('Unexpected failure while uploading profile icons:', error)

    const errorCode = (error as NodeJS.ErrnoException | undefined)?.code
    if (errorCode === 'EHOSTUNREACH' || errorCode === 'ENOTFOUND') {
        console.error(
            'The Postgres host could not be reached. Verify network access to Supabase or adjust the pooler URL in supabase/.temp/pooler-url.',
        )
    }

    process.exitCode = 1
})
