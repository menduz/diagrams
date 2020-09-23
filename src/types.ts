export type Notebook = {
  meta: {
    title: string;
    uid: string;
    sharing?: {
      isPrivate: boolean;
      publicRead: boolean;
    };
  };
};
