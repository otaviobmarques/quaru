-- Alerta do Supabase (lint 0011): funções de gatilho sem search_path fixo.
alter function public.antes_de_gravar() set search_path = public;
alter function public.consentimento_imutavel() set search_path = public;
