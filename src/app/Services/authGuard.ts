import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../Services/supabase.service';

export const authGuard = async () => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  const { data } = await supabaseService.getUser();
  
  if (data.user) {
    return true; 
  } else {
    router.navigate(['/login']); 
    return false; 
  }
};