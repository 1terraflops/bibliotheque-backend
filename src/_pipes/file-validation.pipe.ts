import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  private readonly maxSize = 2 * 1024 * 1024; // 2 mb
  private readonly allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  transform(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (file.size > this.maxSize) {
      throw new BadRequestException('Max size is 2 MB');
    }

    if (!this.allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('This file format is not supported');
    }

    return file;
  }
}
