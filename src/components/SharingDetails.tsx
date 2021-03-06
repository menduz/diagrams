import React from "react";
import { Notebook } from "src/types";

export function SharingDetails(props: { meta: Notebook["meta"] | null }) {
  const sharing = props.meta && props.meta.sharing;

  if (!sharing) return <></>;

  return (
    <>
      {sharing.isPrivate ? (
        <span className="Label mr-1 Label--red" title="Label: private">
          private {sharing.publicRead ? "" : "read and"} write
        </span>
      ) : null}
      {sharing.publicRead ? (
        <span className="Label mr-1 Label--green" title="Label: public read">
          anyone can read {sharing.isPrivate ? "" : " and write"}
        </span>
      ) : null}
    </>
  );
}
