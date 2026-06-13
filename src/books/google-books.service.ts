import { HttpService } from '@nestjs/axios';
import { Injectable, NotFoundException } from '@nestjs/common';

import { firstValueFrom } from 'rxjs';
import { GoogleBooksResponseDto } from './dto/google-books/google-book-item.interface';

import { NormalizedBookDto } from './dto/google-books/normalized-book-dto';

import { isbnDto } from '../_types/isbn.dto';
import { GetBookByNameRequestDto } from './dto/books/get-book-by-name-request.dto';

@Injectable()
export class GoogleBooksService {
  private readonly GBOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;

  constructor(private readonly httpService: HttpService) {}

  async findInGoogleBooks(dto: isbnDto) {
    const response = await firstValueFrom(
      this.httpService.get<GoogleBooksResponseDto>(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${dto.isbn}&key=${this.GBOOKS_API_KEY}`,
      ),
    );

    if (!response || !response.data.items?.length) {
      throw new NotFoundException(`Book with ISBN ${dto.isbn} not found`);
    }

    return new NormalizedBookDto(response.data.items[0]);
  }

  async findByNameInGoogleBooks({ query }: GetBookByNameRequestDto) {
    const response = await firstValueFrom(
      this.httpService.get<GoogleBooksResponseDto>(
        `https://www.googleapis.com/books/v1/volumes`,
        {
          params: {
            q: query,
            key: this.GBOOKS_API_KEY,
            maxResults: 10,
            langRestrict: 'en',
            country: 'US',
          },
        },
      ),
    );

    if (!response.data.items?.length) {
      throw new NotFoundException('No such book found');
    }

    return response.data.items.map((book) => new NormalizedBookDto(book));
  }
}
