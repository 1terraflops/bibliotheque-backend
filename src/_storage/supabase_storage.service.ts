import { Injectable } from '@nestjs/common';
import { supabaseAdmin as supabase } from 'src/_database/supabase';

@Injectable()
export class SupabaseStorageService {
  async upload(
    file: Express.Multer.File,
    bucket: string,
    filename: string,
  ): Promise<string> {
    const ext = file.originalname.split('.').pop();
    const path = `${filename}.${ext}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: true });

    if (error) {
      throw new Error(error.message);
    }

    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }
}
