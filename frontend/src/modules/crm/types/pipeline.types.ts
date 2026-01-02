export type CrmStage = {
  id: string;
  pipelineId: string;
  name: string;
  order: number;
  isWon?: boolean;
  isLost?: boolean;
};

export type CrmPipeline = {
  id: string;
  companyId: string;
  name: string;
  isDefault: boolean;
  stages: CrmStage[];
  _count?: { deals: number };
};

export type PipelineCreateInput = {
  name: string;
  isDefault?: boolean;
  stages?: Array<{
    name: string;
    order: number;
    isWon?: boolean;
    isLost?: boolean;
  }>;
};

export type PipelineUpdateInput = {
  name?: string;
  isDefault?: boolean;
};

export type StageCreateInput = {
  name: string;
  order: number;
  isWon?: boolean;
  isLost?: boolean;
};

export type StageUpdateInput = {
  name?: string;
  order?: number;
  isWon?: boolean;
  isLost?: boolean;
};
