import '../../../../core/utils/typedefs.dart';
import '../../../../core/utils/usecase.dart';
import '../entities/prompt_entity.dart';
import '../repositories/prompt_repository.dart';

class GetPromptsUseCase implements UseCase<List<PromptEntity>, GetPromptsParams> {
  GetPromptsUseCase(this._repository);
  final PromptRepository _repository;

  @override
  ResultFuture<List<PromptEntity>> call(GetPromptsParams params) {
    return _repository.getPrompts(category: params.category, query: params.query);
  }
}

class GetPromptsParams {
  const GetPromptsParams({this.category, this.query});
  final String? category;
  final String? query;
}
