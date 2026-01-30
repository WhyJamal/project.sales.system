export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '—'; 
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      day: '2-digit',
      month: 'long',
    };
    return new Intl.DateTimeFormat('ru-RU', options).format(date);
  };