export interface GoogleBooksResponseDto {
  totalItems: number;
  items?: GoogleBookItem[];
}

export interface GoogleBookItem {
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    pageCount?: number;
    imageLinks?: {
      thumbnail?: string;
    };
    industryIdentifiers: [
      {
        type: string;
        identifier: string;
      },
      {
        type: string;
        identifier: string;
      },
    ];
  };
}
