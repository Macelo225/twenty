import { useObjectMetadataItemById } from '@/object-metadata/hooks/useObjectMetadataItemById';
import { type BarChartDataItem } from '@/page-layout/widgets/graph/graphWidgetBarChart/types/BarChartDataItem';
import { type BarChartLayout } from '@/page-layout/widgets/graph/graphWidgetBarChart/types/BarChartLayout';
import { type BarChartSeries } from '@/page-layout/widgets/graph/graphWidgetBarChart/types/BarChartSeries';
import { useGraphWidgetGroupByQuery } from '@/page-layout/widgets/graph/hooks/useGraphWidgetGroupByQuery';
import { useRelationRecordIdentifiers } from '@/page-layout/widgets/graph/hooks/useRelationRecordIdentifiers';
import { extractRelationIdsFromGroupByResults } from '@/page-layout/widgets/graph/utils/extractRelationIdsFromGroupByResults';
import { getGroupByQueryName } from '@/page-layout/utils/getGroupByQueryName';
import { transformGroupByDataToBarChartData } from '@/page-layout/widgets/graph/utils/transformGroupByDataToBarChartData';
import { useMemo } from 'react';
import { FieldMetadataType } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
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
  layout?: BarChartLayout;
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

  // Extract group-by fields to check if they are relations
  const groupByFieldX = useMemo(
    () =>
      objectMetadataItem.fields.find(
        (field) =>
          field.id === configuration.primaryAxisGroupByFieldMetadataId,
      ),
    [objectMetadataItem, configuration.primaryAxisGroupByFieldMetadataId],
  );

  const groupByFieldY = useMemo(
    () =>
      isDefined(configuration.secondaryAxisGroupByFieldMetadataId)
        ? objectMetadataItem.fields.find(
            (field) =>
              field.id === configuration.secondaryAxisGroupByFieldMetadataId,
          )
        : undefined,
    [objectMetadataItem, configuration.secondaryAxisGroupByFieldMetadataId],
  );

  const groupByFields = useMemo(() => {
    const fields = [];
    if (groupByFieldX) fields.push(groupByFieldX);
    if (groupByFieldY) fields.push(groupByFieldY);
    return fields;
  }, [groupByFieldX, groupByFieldY]);

  // Check if any group-by field is a relation and get the related object name
  const relationField = useMemo(() => {
    return groupByFields.find(
      (field) => field.type === FieldMetadataType.RELATION,
    );
  }, [groupByFields]);

  const relationObjectNameSingular = useMemo(() => {
    if (!relationField?.relation?.targetObjectMetadata) {
      return undefined;
    }
    return relationField.relation.targetObjectMetadata.nameSingular;
  }, [relationField]);

  // Extract relation IDs from the group-by results
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
    [
      groupByData,
      objectMetadataItem,
      configuration,
      aggregateOperation,
      relationRecordIdentifiers,
    ],
  );

  return {
    ...transformedData,
    loading: loading || relationLoading,
    error,
  };
};
