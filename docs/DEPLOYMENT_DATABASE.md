# 🚨 Problema de Base de Datos en Despliegue — SOLUCIONADO

## ❌ Causa Raíz

`drizzle-kit push` es **destructivo** y está diseñado SOLO para desarrollo local:

- Recrea tablas cuando detecta cambios en el schema
- Elimina datos existentes sin aviso
- **NUNCA debe usarse en producción**

Si lo estabas ejecutando en Dokploy (en el "Build Command" o manualmente vía SSH), esa es la causa de que las tablas desaparecieran.

## ✅ Solución Implementada

### Archivos creados/modificados

| Archivo | Cambio |
|---------|--------|
| `nixpacks.toml` | Dokploy ejecuta migraciones automáticamente al arrancar |
| `lib/db/migrate.ts` | Script inteligente: aplica migraciones o hace baseline si las tablas ya existen |
| `lib/db/migrations/` | Carpeta donde se guardarán los archivos de migración SQL |
| `package.json` | `db:migrate` ahora usa el script seguro |

### Cómo funciona `lib/db/migrate.ts`

1. **BD vacía (nuevo deploy)** → Aplica todas las migraciones en orden → crea las tablas
2. **BD con tablas existentes + sin historial** → Hace *baseline* automático: registra las migraciones como ya aplicadas SIN borrar nada → **preserva todos los datos**
3. **BD con historial** → Solo aplica las migraciones pendientes → comportamiento normal

---

## 📋 Workflow: Primera vez con Dokploy (DB ya tiene tablas)

### Paso 1 — Generar migraciones (en tu máquina local)

```bash
npm run db:generate
```

Esto crea archivos SQL en `lib/db/migrations/`. **Commitea esta carpeta al repositorio.**

```bash
git add lib/db/migrations/
git commit -m "feat: add initial database migrations"
git push
```

### Paso 2 — Verificar configuración en Dokploy

Abre tu app en Dokploy y asegúrate de que:

- **Build Command**: `npm run build` (solo esto, sin db:push)
- **Start Command**: dejar vacío (lo gestiona `nixpacks.toml`)

Si en el Build Command tenías `npm run db:push` o similar → **elimínalo**.

### Paso 3 — Redesplegar

Dokploy leerá `nixpacks.toml` y ejecutará automáticamente:
```
npm ci → npm run build → npm run db:migrate && npm run start
```

En el primer deploy con la nueva configuración verás en los logs:
```
⚠️  Tables already exist — baselining migration history...
   ✓ Baselined: 0000_initial
✅ Baseline complete — existing schema and data preserved
```

A partir de ahí, los datos quedan protegidos.

---

## 📋 Workflow: Cambios en el schema (uso cotidiano)

```
1. Modifica lib/db/schema.ts
2. npm run db:generate          ← genera SQL incremental
3. Revisa lib/db/migrations/    ← verifica que el SQL es correcto
4. git add . && git commit && git push
5. Dokploy redespliega automáticamente
6. db:migrate aplica solo los cambios nuevos
```

---

## 📋 Scripts disponibles

| Script | Cuándo usarlo |
|--------|---------------|
| `npm run db:generate` | Local — después de cambiar `schema.ts` |
| `npm run db:migrate` | Producción — aplica cambios de forma segura |
| `npm run db:push` | Solo desarrollo local rápido — **NUNCA en producción** |
| `npm run db:studio` | Explorar la BD visualmente (local) |

---

## 📁 Estructura de migraciones

```
lib/db/
├── migrations/
│   ├── 0000_initial_schema.sql   ← generado por db:generate
│   ├── 0001_add_new_field.sql    ← futuros cambios
│   └── meta/
│       └── _journal.json         ← índice de migraciones
├── schema.ts                     ← fuente de verdad del schema
├── index.ts                      ← cliente de DB
└── migrate.ts                    ← script de migración inteligente
```

---

## 🆘 Recuperación de emergencia (si ya perdiste datos)

```bash
# 1. Restaurar desde backup (si tienes uno)
psql $DATABASE_URL < backup.sql

# 2. Si no hay backup — recrear estructura vacía
psql $DATABASE_URL -f scripts/setup-db.sql

# 3. Generar y aplicar migraciones desde cero
npm run db:generate
# commit la carpeta migrations/ y redespliega en Dokploy
```

**Prevenir pérdidas futuras:** configura backups automáticos de PostgreSQL en tu VPS de CubePath:
```bash
# Cron diario a las 2am
0 2 * * * pg_dump beautycrm > /backups/beautycrm_$(date +\%Y\%m\%d).sql
```
