import { savePost } from "@/lib/actions/admin/blog";
import { AdminForm } from "@/components/admin/admin-form";
import { AdminHeader } from "@/components/admin/ui";
import { PostFields } from "../post-fields";
import { getPostFormOptions } from "../data";

export default async function NewPostPage() {
  const options = await getPostFormOptions();
  return (
    <div>
      <AdminHeader title="New article" back={{ href: "/admin/blog", label: "Blog posts" }} />
      <AdminForm action={savePost.bind(null, null)}>
        <PostFields {...options} />
      </AdminForm>
    </div>
  );
}
