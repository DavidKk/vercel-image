import { cloneSchema, completeSchemaDefaults } from '../services/layout'
import { collage } from './collage'
import { grid } from './grid'
import { horizontalStack } from './horizontalStack'
import { parallelogram } from './parallelogram'
import { slantedStack } from './slantedStack'
import { verticalStack } from './verticalStack'

const layoutSchemas = { grid, verticalStack, horizontalStack, slantedStack, collage, parallelogram }
export const SCHEMA_IDS = Object.keys(layoutSchemas) as SchemaId[]
export type SchemaId = keyof typeof layoutSchemas

export const isSchemaId = (id: string): id is SchemaId => {
  return SCHEMA_IDS.includes(id as SchemaId)
}

export const fetchSchemas = async () => {
  return Object.fromEntries(
    (function* () {
      for (const [id, schema] of Object.entries(layoutSchemas)) {
        yield [id, completeSchemaDefaults(cloneSchema(schema))]
      }
    })()
  )
}

export const fetchSchema = async (id: string) => {
  if (!isSchemaId(id)) {
    // eslint-disable-next-line no-console
    console.error('Schema id is invalid')
    return
  }

  return completeSchemaDefaults(cloneSchema(layoutSchemas[id]))
}
