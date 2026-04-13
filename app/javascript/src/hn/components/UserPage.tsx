import React from "react";

import { mapUserToViewModel } from "../../hn/lib/mappers";
import { fetchUser } from "../../hn/lib/server";

import { formatAbsoluteDate } from "./formatting";
import * as styles from "./UserPage.module.css";

interface UserPageProps {
  userId: string;
}

export default async function UserPage({ userId }: UserPageProps) {
  const user = mapUserToViewModel(await fetchUser(userId));

  if (!user) {
    return (
      <article className={styles.user}>
        <h1 className={styles.title}>User not found</h1>
        <p>The requested profile does not exist.</p>
      </article>
    );
  }

  return (
    <article className={styles.user}>
      <h1 className={styles.title}>User: {user.id}</h1>
      <dl className={styles.meta}>
        <div>
          <dt>created</dt>
          <dd>{formatAbsoluteDate(user.createdMs)}</dd>
        </div>
        <div>
          <dt>karma</dt>
          <dd>{user.karma}</dd>
        </div>
        <div>
          <dt>submissions</dt>
          <dd>{user.submittedIds.length}</dd>
        </div>
      </dl>
      {user.about ? (
        <div
          className={styles.about}
          dangerouslySetInnerHTML={{ __html: user.about }}
        />
      ) : (
        <p className={styles.aboutEmpty}>No bio provided.</p>
      )}
    </article>
  );
}
