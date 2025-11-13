import { FieldMetadataType } from '~/generated-metadata/graphql';
import { isDefined } from 'twenty-shared/utils';
import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';

type GroupByRawResult = {
  groupByDimensionValues: (string | number | null)[];
};

type ExtractRelationIdsFromGroupByResultsParams = {
  rawResults: GroupByRawResult[];
  groupByFields: FieldMetadataItem[];
};

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
      if (field?.type === FieldMetadataType.RELATION && isDefined(value)) {
        const idValue = String(value);
        // Basic UUID validation
        if (idValue.length === 36 && idValue.includes('-')) {
          relationIds.add(idValue);
        }
      }
    });
  });

  return Array.from(relationIds);
};
