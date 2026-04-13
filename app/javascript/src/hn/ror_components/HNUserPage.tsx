import React from "react";

import Layout from "../components/Layout";
import UserPage from "../components/UserPage";

interface HNUserPageProps {
  userId?: string;
}

export default function HNUserPage({ userId }: HNUserPageProps) {
  return (
    <Layout>
      <UserPage userId={userId ?? ""} />
    </Layout>
  );
}
