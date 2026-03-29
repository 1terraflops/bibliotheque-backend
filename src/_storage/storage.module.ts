import { Global, Module } from '@nestjs/common';
import { SupabaseStorageService } from './supabase_storage.service';

@Global()
@Module({
  providers: [SupabaseStorageService],
  exports: [SupabaseStorageService],
})
export class StorageModule {}
