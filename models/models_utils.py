from typing import Dict, List, Union


def map_to_dto(dto_mappable_object_list) -> List[Dict[str, Union[str, bool, int]]]:
    return [dto_mappable_object.to_dto() for dto_mappable_object in dto_mappable_object_list]
