
import { supabase } from "@/integrations/supabase/client";

const OPTIMAL_BATCH_SIZE = 1000;
const MAX_CHUNK_SIZE = 500; // For IN queries and upserts

export interface BatchProcessingOptions {
  batchSize?: number;
  chunkSize?: number;
  onProgress?: (processed: number, total: number) => void;
}

export class LargeScaleContactService {
  static async processContactsInBatches<T>(
    contactIds: string[],
    processor: (batch: string[]) => Promise<T[]>,
    options: BatchProcessingOptions = {}
  ): Promise<T[]> {
    const { batchSize = OPTIMAL_BATCH_SIZE, onProgress } = options;
    const results: T[] = [];
    
    console.log(`Processing ${contactIds.length} contacts in batches of ${batchSize}`);
    
    for (let i = 0; i < contactIds.length; i += batchSize) {
      const batch = contactIds.slice(i, i + batchSize);
      const batchResults = await processor(batch);
      results.push(...batchResults);
      
      if (onProgress) {
        onProgress(i + batch.length, contactIds.length);
      }
      
      console.log(`Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(contactIds.length / batchSize)}`);
    }
    
    return results;
  }

  static async fetchContactsInChunks(
    emails: string[],
    options: BatchProcessingOptions = {}
  ): Promise<any[]> {
    const { chunkSize = MAX_CHUNK_SIZE } = options;
    const allContacts: any[] = [];
    
    console.log(`Fetching ${emails.length} contacts in chunks of ${chunkSize}`);
    
    for (let i = 0; i < emails.length; i += chunkSize) {
      const chunk = emails.slice(i, i + chunkSize);
      
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .in('email', chunk);

      if (error) {
        console.error(`Error fetching contact chunk ${i}-${i + chunkSize}:`, error);
        throw error;
      }

      if (contacts) {
        allContacts.push(...contacts);
      }
      
      console.log(`Fetched chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(emails.length / chunkSize)}`);
    }
    
    return allContacts;
  }

  static async upsertContactsInBatches(
    contacts: any[],
    options: BatchProcessingOptions = {}
  ): Promise<void> {
    const { batchSize = MAX_CHUNK_SIZE, onProgress } = options;
    
    console.log(`Upserting ${contacts.length} contacts in batches of ${batchSize}`);
    
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from('contacts')
        .upsert(batch, { 
          onConflict: 'email',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`Error upserting batch ${i}-${i + batchSize}:`, error);
        throw error;
      }

      if (onProgress) {
        onProgress(i + batch.length, contacts.length);
      }
      
      console.log(`Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(contacts.length / batchSize)}`);
    }
  }

  static async getAllContactsWithPagination(): Promise<any[]> {
    let allContacts: any[] = [];
    let from = 0;
    const batchSize = OPTIMAL_BATCH_SIZE;
    
    while (true) {
      const { data: contacts, error } = await supabase
        .from("contacts")
        .select("*")
        .range(from, from + batchSize - 1)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching contacts batch:", error);
        throw error;
      }

      if (!contacts || contacts.length === 0) {
        break;
      }

      allContacts = allContacts.concat(contacts);
      console.log(`Fetched batch: ${contacts.length} contacts (total: ${allContacts.length})`);

      if (contacts.length < batchSize) {
        break;
      }

      from += batchSize;
    }

    return allContacts;
  }
}
