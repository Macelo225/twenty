import { getObjectRecordIdentifier } from '@/object-metadata/utils/getObjectRecordIdentifier';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
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
  const { records, loading, objectMetadataItem } = useFindManyRecords({
    objectNameSingular,
    filter: {
      id: {
        in: recordIds,
      },
    },
    skip: skip || recordIds.length === 0,
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
