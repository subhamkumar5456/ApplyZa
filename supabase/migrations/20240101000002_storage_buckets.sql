-- Create storage bucket for resumes
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'resumes',
  'resumes',
  false,
  10485760,
  array['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Storage policies
create policy "Users can upload their own resumes"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own resumes"
  on storage.objects for select
  using (
    bucket_id = 'resumes' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own resumes"
  on storage.objects for delete
  using (
    bucket_id = 'resumes' and
    auth.uid()::text = (storage.foldername(name))[1]
  );
