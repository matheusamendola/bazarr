import { FunctionComponent, useCallback, useMemo } from "react";
import { Badge, Button, Group } from "@mantine/core";
import { faTrash, faWrench } from "@fortawesome/free-solid-svg-icons";
import { ColumnDef } from "@tanstack/react-table";
import { cloneDeep } from "lodash";
import { Action } from "@/components";
import {
  anyCutoff,
  ProfileEditModal,
} from "@/components/forms/ProfileEditForm";
import SimpleTable from "@/components/tables/SimpleTable";
import { useModals } from "@/modules/modals";
import { languageProfileKey } from "@/pages/Settings/keys";
import { useFormActions } from "@/pages/Settings/utilities/FormValues";
import { BuildKey, useArrayAction } from "@/utilities";
import { useLatestEnabledLanguages, useLatestProfiles } from ".";

const Table: FunctionComponent = () => {
  const profiles = useLatestProfiles();

  const languages = useLatestEnabledLanguages();

  const nextProfileId = useMemo(
    () =>
      1 +
      profiles.reduce<number>((val, prof) => Math.max(prof.profileId, val), 0),
    [profiles],
  );

  const { setValue } = useFormActions();

  const modals = useModals();

  const submitProfiles = useCallback(
    (list: Language.Profile[]) => {
      setValue(list, languageProfileKey, (value) => JSON.stringify(value));
    },
    [setValue],
  );

  const updateProfile = useCallback(
    (profile: Language.Profile) => {
      const list = [...profiles];

      const idx = list.findIndex((v) => v.profileId === profile.profileId);

      if (idx !== -1) {
        list[idx] = profile;
      } else {
        list.push(profile);
      }
      submitProfiles(list);
    },
    [profiles, submitProfiles],
  );

  const action = useArrayAction<Language.Profile>((fn) => {
    const list = [...profiles];
    submitProfiles(fn(list));
  });

  const columns = useMemo<ColumnDef<Language.Profile>[]>(
    () => [
      {
        header: "Name",
        accessorKey: "name",
      },
      {
        header: "Tag",
        accessorKey: "tag",
      },
      {
        header: "Languages",
        accessorKey: "items",
        cell: ({
          row: {
            original: { items, cutoff },
          },
        }) => {
          return (
            <Group gap="xs" wrap="nowrap">
              {items.map((v) => {
                const isCutoff = v.id === cutoff || cutoff === anyCutoff;
                return (
                  <ItemBadge key={v.id} cutoff={isCutoff} item={v}></ItemBadge>
                );
              })}
            </Group>
          );
        },
      },
      {
        header: "Must contain",
        accessorKey: "mustContain",
        cell: ({
          row: {
            original: { mustContain },
          },
        }) => {
          if (!mustContain) {
            return null;
          }
          return (
            <>
              {mustContain.map((v, idx) => {
                return (
                  <Badge key={BuildKey(idx, v)} color="gray">
                    {v}
                  </Badge>
                );
              })}
            </>
          );
        },
      },
      {
        header: "Must not contain",
        accessorKey: "mustNotContain",
        cell: ({
          row: {
            original: { mustNotContain },
          },
        }) => {
          if (!mustNotContain) {
            return null;
          }
          return (
            <>
              {mustNotContain.map((v, idx) => {
                return (
                  <Badge key={BuildKey(idx, v)} color="gray">
                    {v}
                  </Badge>
                );
              })}
            </>
          );
        },
      },
      {
        id: "profileId",
        cell: ({ row }) => {
          const profile = row.original;
          return (
            <Group gap="xs" wrap="nowrap">
              <Action
                label="Edit Profile"
                icon={faWrench}
                c="gray"
                onClick={() => {
                  modals.openContextModal(ProfileEditModal, {
                    languages,
                    profile: cloneDeep(profile),
                    onComplete: updateProfile,
                  });
                }}
              ></Action>
              <Action
                label="Remove"
                icon={faTrash}
                c="red"
                onClick={() => action.remove(row.index)}
              ></Action>
            </Group>
          );
        },
      },
    ],
    // TODO: Optimize this
    [action, languages, modals, updateProfile],
  );

  const canAdd = languages.length !== 0;

  return (
    <>
      <SimpleTable columns={columns} data={[...profiles]}></SimpleTable>
      <Button
        fullWidth
        disabled={!canAdd}
        onClick={() => {
          const profile = {
            profileId: nextProfileId,
            name: "",
            tag: undefined,
            items: [],
            cutoff: null,
            mustContain: [],
            mustNotContain: [],
            originalFormat: false,
          };
          modals.openContextModal(ProfileEditModal, {
            languages,
            profile,
            onComplete: updateProfile,
          });
        }}
      >
        {canAdd ? "Add New Profile" : "No Enabled Languages"}
      </Button>
    </>
  );
};

interface ItemProps {
  item: Language.ProfileItem;
  cutoff: boolean;
}

const ItemBadge: FunctionComponent<ItemProps> = ({ cutoff, item }) => {
  const text = useMemo(() => {
    let result = item.language;
    if (item.hi === "True") {
      result += ":HI";
    } else if (item.forced === "True") {
      result += ":Forced";
    }
    return result;
  }, [item.hi, item.forced, item.language]);
  return (
    <Badge
      title={cutoff ? "Ignore others if this one is available" : undefined}
      color={cutoff ? "primary" : "secondary"}
    >
      {text}
    </Badge>
  );
};

export default Table;
