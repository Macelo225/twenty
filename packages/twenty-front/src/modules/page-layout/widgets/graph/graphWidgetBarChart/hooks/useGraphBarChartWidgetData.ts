import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { type BarChartDataItem } from '@/page-layout/widgets/graph/graphWidgetBarChart/types/BarChartDataItem';
import { type BarChartSeries } from '@/page-layout/widgets/graph/graphWidgetBarChart/types/BarChartSeries';
import { useGraphWidgetGroupByQuery } from '@/page-layout/widgets/graph/hooks/useGraphWidgetGroupByQuery';
import { useRelationRecordIdentifiers } from '@/page-layout/widgets/graph/hooks/useRelationRecordIdentifiers';
import { extractRelationIdsFromGroupByResults } from '@/page-layout/widgets/graph/utils/extractRelationIdsFromGroupByResults';
import { transformGroupByDataToBarChartData } from '@/page-layout/widgets/graph/utils/transformGroupByDataToBarChartData';
import { getGroupByQueryName } from '@/page-layout/utils/getGroupByQueryName';
import { useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { FieldMetadataType } from '~/generated-metadata/graphql';
import { type BarChartConfiguration } from '~/generated/graphql';

type UseGraphBarChartWidgetDataProps = {
  objectMetadataItemId: string;
  configuration: BarChartConfiguration;
};

type UseGraphBarChartWidgetDataResult = {
  data: BarChartDataItem[];
  indexBy: string;
  keys: string[];
  series: BarChartSeries[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  showDataLabels: boolean;
  layout?: 'vertical' | 'horizontal';
  loading: boolean;
  error?: Error;
  hasTooManyGroups: boolean;
};

export const useGraphBarChartWidgetData = ({
  objectMetadataItemId,
  configuration,
}: UseGraphBarChartWidgetDataProps): UseGraphBarChartWidgetDataResult => {
  const { objectMetadataItem } = useObjectMetadataItemById({
    objectId: objectMetadataItemId,
  });

  const {
    data: groupByData,
    loading,
    error,
    aggregateOperation,
  } = useGraphWidgetGroupByQuery({
    objectMetadataItemId,
    configuration,
  });

  // Determine group-by fields for relation resolution
  const groupByFields = useMemo(() => {
    const fields = [];

    if (configuration.primaryAxisGroupByFieldMetadataId) {
      const primaryField = objectMetadataItem?.fields.find(
        (f) => f.id === configuration.primaryAxisGroupByFieldMetadataId,
      );
      if (primaryField) fields.push(primaryField);
    }

    if (configuration.secondaryAxisGroupByFieldMetadataId) {
      const secondaryField = objectMetadataItem?.fields.find(
        (f) => f.id === configuration.secondaryAxisGroupByFieldMetadataId,
      );
      if (secondaryField) fields.push(secondaryField);
    }

    return fields;
  }, [
    objectMetadataItem,
    configuration.primaryAxisGroupByFieldMetadataId,
    configuration.secondaryAxisGroupByFieldMetadataId,
  ]);

  // Find the first relation field (we only support one for now)
  const relationField = useMemo(() => {
    return groupByFields.find((field) => field.type === FieldMetadataType.RELATION);
  }, [groupByFields]);

  // Get the target object name for the relation
  const relationObjectNameSingular = useMemo(() => {
    if (!relationField?.relation?.targetObjectMetadata) {
      return undefined;
    }
    return relationField.relation.targetObjectMetadata.nameSingular;
  }, [relationField]);

  // Extract relation IDs from query results
  const relationIds = useMemo(() => {
    if (!isDefined(groupByData) || !relationObjectNameSingular) {
      return [];
    }

    const queryName = getGroupByQueryName(objectMetadataItem);
    const rawResults = groupByData[queryName];

    if (!isDefined(rawResults) || !Array.isArray(rawResults)) {
      return [];
    }

    return extractRelationIdsFromGroupByResults({
      rawResults,
      groupByFields,
    });
  }, [groupByData, objectMetadataItem, groupByFields, relationObjectNameSingular]);

  // Fetch relation record labels
  const { relationRecordIdentifiers, loading: relationLoading } =
    useRelationRecordIdentifiers({
      objectNameSingular: relationObjectNameSingular ?? '',
      recordIds: relationIds,
      skip: !relationObjectNameSingular || relationIds.length === 0,
    });

  const transformedData = useMemo(
    () =>
      transformGroupByDataToBarChartData({
        groupByData,
        objectMetadataItem,
        configuration,
        aggregateOperation,
        relationRecordIdentifiers,
      }),
    [groupByData, objectMetadataItem, configuration, aggregateOperation, relationRecordIdentifiers],
  );

  return {
    ...transformedData,
    loading: loading || relationLoading,
    error,
  };
};
