export const photoUrl = (name: string, w = 1200) => {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
  return `https://${projectId}.supabase.co/functions/v1/place-photo?name=${encodeURIComponent(
    name,
  )}&w=${w}`;
};
