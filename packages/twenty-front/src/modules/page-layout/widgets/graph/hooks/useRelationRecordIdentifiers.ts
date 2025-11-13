import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { getObjectRecordIdentifier } from '@/object-record/utils/getObjectRecordIdentifier';
import { useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';

type UseRelationRecordIdentifiersParams = {
  objectNameSingular: string;
  recordIds: string[];
  skip?: boolean;
};

export const useRelationRecordIdentifiers = ({
  objectNameSingular,
  recordIds,
  skip = false,
}: UseRelationRecordIdentifiersParams) => {
  const shouldSkip = skip || recordIds.length === 0 || !objectNameSingular;

  const { records, loading, objectMetadataItem } = useFindManyRecords({
    objectNameSingular: objectNameSingular || 'company', // Fallback to avoid empty string
    filter: {
      id: {
        in: recordIds,
      },
    },
    skip: shouldSkip,
  });

  const relationRecordIdentifiers = useMemo(() => {
    if (!isDefined(records) || !isDefined(objectMetadataItem)) {
      return new Map<string, string>();
    }

    const identifiersMap = new Map<string, string>();
    records.forEach((record) => {
      const identifier = getObjectRecordIdentifier({
        objectMetadataItem,
        record,
      });
      identifiersMap.set(record.id, identifier.name);
    });

    return identifiersMap;
  }, [records, objectMetadataItem]);

  return {
    relationRecordIdentifiers,
    loading,
  };
};
