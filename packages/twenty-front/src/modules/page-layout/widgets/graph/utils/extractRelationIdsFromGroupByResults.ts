import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type GroupByRawResult } from '@/page-layout/widgets/graph/types/GroupByRawResult';
import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

type ExtractRelationIdsFromGroupByResultsParams = {
  rawResults: GroupByRawResult[];
  groupByFields: FieldMetadataItem[];
};

/**
 * Extracts all relation IDs from group-by results based on which dimensions are relation fields
 */
export const extractRelationIdsFromGroupByResults = ({
  rawResults,
  groupByFields,
}: ExtractRelationIdsFromGroupByResultsParams): string[] => {
  const relationIds = new Set<string>();

  rawResults.forEach((result) => {
    const dimensionValues = result.groupByDimensionValues;
    if (!isDefined(dimensionValues)) return;

    dimensionValues.forEach((value, index) => {
      const field = groupByFields[index];

      // Check if this dimension corresponds to a relation field
      if (field?.type === FieldMetadataType.RELATION && isDefined(value)) {
        const idValue = String(value);
        // Basic UUID validation (36 chars with hyphens)
        if (idValue.length === 36 && idValue.includes('-')) {
          relationIds.add(idValue);
        }
      }
    });
  });

  return Array.from(relationIds);
};
