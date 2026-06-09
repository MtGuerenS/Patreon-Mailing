export type DbMember = {
    id: string;
    full_name: string | null;
    raw_addressee: string | null;
    raw_line_1: string | null;
    raw_line_2: string | null;
    raw_city: string | null;
    raw_state: string | null;
    raw_postal_code: string | null;
    raw_country: string | null;
    clean_addressee: string | null;
    clean_line_1: string | null;
    clean_line_2: string | null;
    clean_city: string | null;
    clean_state: string | null;
    clean_postal_code: string | null;
    clean_country: string | null;
    address_status: "verified" | "check_needed" | "missing";
    updated_at: string | null;
  };
  