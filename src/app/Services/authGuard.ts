import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../Services/supabase.service';

export const authGuard = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  const { data: { session } } = await supabaseService.getCurrentSession();
  
  if (session?.access_token) {
    return true; 
  } else {
    router.navigate(['/login']); 
    return false; 
  }
};