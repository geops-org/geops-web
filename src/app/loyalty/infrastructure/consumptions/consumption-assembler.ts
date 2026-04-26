import { BaseAssembler } from '../../../shared/infrastructure/base-assembler';
import { ConsumptionResource, ConsumptionsResponse } from './consumption-response';

export type Consumption = ConsumptionResource;

export class ConsumptionAssembler
  implements BaseAssembler<Consumption, ConsumptionResource, ConsumptionsResponse>
{
  toEntityFromResource(r: ConsumptionResource): Consumption {
    return { ...r };
  }

  toResourceFromEntity(e: Consumption): ConsumptionResource {
    return { ...e };
  }

  toEntitiesFromResponse(_r: ConsumptionsResponse): Consumption[] {
    return [];
  }
}
