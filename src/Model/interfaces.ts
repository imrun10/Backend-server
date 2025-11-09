export interface textInterface {
  body: string;
  id: string;
  from: string;
  valid: boolean;
  error?: string;
}

export interface NewUser{
  name: string; 
  phone: number;
  state: string;
  address?: string;
  extention?: string | '+234';
}

export interface NewFarm{
  farm_name: string;
  state: string;
  address?: string;
  total_size: string;
  units: string | 'hectares';
}

export interface NewCrops{
  farm : number;
  crops: number
}
