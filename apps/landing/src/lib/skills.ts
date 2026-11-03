import { api } from './api';

export interface SkillListItem {
  name: string;
  latest_version: string;
  description: string;
  tools_count: number;
  permissions: string[];
  triggers: string[];
}

interface SkillListResponse {
  skills: SkillListItem[];
  total: number;
}

export async function listSkills(): Promise<SkillListItem[]> {
  const response = await api.get<SkillListResponse>('/control/v1/skills');
  return response.skills;
}
