import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { of } from 'rxjs';
import { GoogleBooksService } from '../google-books.service';
import { NormalizedBookDto } from '../dto/google-books/normalized-book-dto';

const mockGoogleBookItem = {
  id: 'abc123',
  volumeInfo: {
    title: 'Test Book',
    authors: ['Test Author'],
    description: 'A test description',
    industryIdentifiers: [{ type: 'ISBN_13', identifier: '9786175480083' }],
    pageCount: 300,
    imageLinks: { thumbnail: 'https://example.com/cover.jpg' },
  },
};

const mockGoogleBooksResponse = {
  data: {
    items: [mockGoogleBookItem],
  },
};

const mockEmptyResponse = {
  data: {
    items: [],
  },
};

const mockHttpService = {
  get: jest.fn(),
};

const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

describe('GoogleBooksService', () => {
  let service: GoogleBooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleBooksService,
        { provide: HttpService, useValue: mockHttpService },
        { provide: WINSTON_MODULE_PROVIDER, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<GoogleBooksService>(GoogleBooksService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('findInGoogleBooks', () => {
    const dto = { isbn: '9786175480083' };

    it('returns a NormalizedBookDto when book is found', async () => {
      mockHttpService.get.mockReturnValue(of(mockGoogleBooksResponse));

      const result = await service.findInGoogleBooks(dto);

      expect(result).toBeInstanceOf(NormalizedBookDto);
    });

    it('throws NotFoundException when response has no items', async () => {
      mockHttpService.get.mockReturnValue(of(mockEmptyResponse));

      await expect(service.findInGoogleBooks(dto)).rejects.toThrow(
        new NotFoundException(`Book with ISBN ${dto.isbn} not found`),
      );
    });

    it('logs a warning when response has no items', async () => {
      mockHttpService.get.mockReturnValue(of(mockEmptyResponse));

      await expect(service.findInGoogleBooks(dto)).rejects.toThrow();

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Google Books returned no results',
        expect.objectContaining({ isbn: dto.isbn }),
      );
    });

    it('throws NotFoundException when items is undefined', async () => {
      mockHttpService.get.mockReturnValue(of({ data: {} }));

      await expect(service.findInGoogleBooks(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByNameInGoogleBooks', () => {
    const dto = { query: 'Test Book' };

    it('returns an array of NormalizedBookDto when results are found', async () => {
      const multipleItems = {
        data: { items: [mockGoogleBookItem, mockGoogleBookItem] },
      };
      mockHttpService.get.mockReturnValue(of(multipleItems));

      const result = await service.findByNameInGoogleBooks(dto);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(NormalizedBookDto);
      expect(result[1]).toBeInstanceOf(NormalizedBookDto);
    });

    it('throws NotFoundException when response has no items', async () => {
      mockHttpService.get.mockReturnValue(of(mockEmptyResponse));

      await expect(service.findByNameInGoogleBooks(dto)).rejects.toThrow(
        new NotFoundException('No such book found'),
      );
    });

    it('throws NotFoundException when items is undefined', async () => {
      mockHttpService.get.mockReturnValue(of({ data: {} }));

      await expect(service.findByNameInGoogleBooks(dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
