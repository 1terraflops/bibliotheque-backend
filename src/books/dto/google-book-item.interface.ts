export interface GoogleBooksResponseDto {
  totalItems: number;
  items?: GoogleBookItem[];
}

export interface GoogleBookItem {
  volumeInfo: {
    title: string;
    authors?: string;
    description?: string;
    pageCount?: number;
    imageLinks?: {
      thumbnail?: string;
    };
  };
}
