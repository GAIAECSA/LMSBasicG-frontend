/** Lista blanca de operaciones BFF. No existe proxy genérico arbitrario. */
export type Verb='GET'|'POST'|'PUT'|'PATCH'|'DELETE';
const id='[1-9]\\d*';
type RouteSpec={pattern:RegExp;methods:Verb[];to:(m:RegExpMatchArray,courseId:number)=>string;form?:boolean};
const allowed=(pattern:string,methods:Verb[],to:(m:RegExpMatchArray,id:number)=>string,form=false):RouteSpec=>({pattern:new RegExp(`^${pattern}$`),methods,to,form});
const prefix='/api/v1/';
export const ROUTES:RouteSpec[]=[
  allowed('structure',['GET'],(_,id)=>`academic-modules/${id}/structure`),
  allowed('order',['PUT'],(_,id)=>`academic-modules/${id}/structure/order`),
  allowed('grade-plan',['GET'],(_,id)=>`academic-modules/${id}/grade-plan`),
  allowed('grade-plan/draft',['PUT'],(_,id)=>`academic-modules/${id}/grade-plan/draft`),
  allowed('grade-plan/activate',['POST'],(_,id)=>`academic-modules/${id}/grade-plan/activate`),
  allowed('block-types',['GET'],()=>`lesson-block-types/lesson-block-types`),
  allowed('modules',['POST'],()=>`modules`),
  allowed(`modules/(${id})`,['PUT','DELETE'],m=>`modules/${m[1]}`),
  allowed('lessons',['POST'],()=>`lessons`),
  allowed(`lessons/(${id})`,['PUT','DELETE'],m=>`lessons/${m[1]}`),
  allowed('blocks',['POST'],()=>`lesson-blocks`,true),
  allowed(`blocks/(${id})`,['GET','PUT','DELETE'],m=>`lesson-blocks/${m[1]}`,true),
  allowed(`blocks/(${id})/file`,['GET'],m=>`media/lesson-blocks/${m[1]}/file`),
  allowed(`quiz/blocks/(${id})/config`,['PATCH'],m=>`quiz/blocks/${m[1]}/config`),
  allowed(`quiz/blocks/(${id})/questions`,['GET','POST'],m=>`quiz/blocks/${m[1]}/questions`),
  allowed(`quiz/blocks/(${id})/questions/gift/(preview|import)`,['POST'],m=>`quiz/blocks/${m[1]}/questions/gift/${m[2]}`),
  allowed(`quiz/blocks/(${id})/results`,['GET'],m=>`quiz/blocks/${m[1]}/results`),
  allowed(`quiz/questions/(${id})`,['PATCH'],m=>`quiz/questions/${m[1]}`),
  allowed(`quiz/questions/(${id})/correct-answer`,['PATCH'],m=>`quiz/questions/${m[1]}/correct-answer`),
  allowed(`quiz/attempts/(${id})`,['GET'],m=>`quiz/attempts/${m[1]}`),
  allowed(`quiz/attempts/(${id})/review`,['GET'],m=>`quiz/attempts/${m[1]}/review`),
  allowed('survey/surveys',['POST'],()=>`survey/surveys`),
  allowed('survey/course',['GET'],(_,id)=>`survey/courses/${id}/surveys`),
  allowed(`survey/surveys/(${id})`,['GET','PATCH'],m=>`survey/surveys/${m[1]}`),
  allowed(`survey/surveys/(${id})/questions`,['POST'],m=>`survey/surveys/${m[1]}/questions`),
  allowed(`survey/surveys/(${id})/results`,['GET'],m=>`survey/surveys/${m[1]}/results`),
  allowed(`survey/surveys/(${id})/my-response`,['GET'],m=>`survey/surveys/${m[1]}/my-response`),
  allowed(`survey/surveys/(${id})/submit`,['POST'],m=>`survey/surveys/${m[1]}/submit`),
  allowed(`survey/surveys/(${id})/questions/csv/(preview|import)`,['POST'],m=>`survey/surveys/${m[1]}/questions/csv/${m[2]}`),
  allowed(`survey/questions/(${id})`,['PATCH','DELETE'],m=>`survey/questions/${m[1]}`),
  allowed(`forum/blocks/(${id})/topic`,['GET','POST','PATCH'],m=>`forum-response/blocks/${m[1]}/topic`),
  allowed(`forum/blocks/(${id})/posts`,['GET'],m=>`forum-response/blocks/${m[1]}/posts`),
  allowed(`forum/posts/(${id})/moderation`,['PATCH'],m=>`forum-response/posts/${m[1]}/moderation`),
  allowed(`homework/blocks/(${id})/submissions`,['GET'],m=>`homework-response/blocks/${m[1]}/submissions`),
  allowed(`homework/blocks/(${id})/settings`,['GET','PUT'],m=>`homework-response/blocks/${m[1]}/settings`),
  allowed(`homework/submissions/(${id})/grade`,['PUT'],m=>`homework-response/submissions/${m[1]}/grade`),
  allowed(`homework/attachments/(${id})/download`,['GET'],m=>`homework-response/attachments/${m[1]}/download`),
  allowed(`assisted/quiz/blocks/(${id})/enrollments/(${id})/start`,['POST'],m=>`academic-assisted/quiz/blocks/${m[1]}/enrollments/${m[2]}/start`),
  allowed(`assisted/quiz/attempts/(${id})/submit`,['POST'],m=>`academic-assisted/quiz/attempts/${m[1]}/submit`),
  allowed(`assisted/quiz/attempts/(${id})/override`,['PATCH'],m=>`academic-assisted/quiz/attempts/${m[1]}/override`),
  allowed(`assisted/surveys/(${id})/enrollments/(${id})`,['POST'],m=>`academic-assisted/surveys/${m[1]}/enrollments/${m[2]}`),
  allowed(`assisted/forum/blocks/(${id})/enrollments/(${id})/posts`,['POST'],m=>`academic-assisted/forum/blocks/${m[1]}/enrollments/${m[2]}/posts`),
  allowed(`assisted/homework/blocks/(${id})/enrollments/(${id})`,['POST'],m=>`academic-assisted/homework/blocks/${m[1]}/enrollments/${m[2]}`,true),
  allowed('assisted/events',['GET'],(_,id)=>`academic-assisted/courses/${id}/events`),
  // ADMIN obtiene listado de matrículas para formularios asistidos; TEACHER usa la matriz paginada.
  allowed('participants',['GET'],(_,id)=>`courses/${id}/grades`),
  allowed('participants/teachers',['GET'],(_,id)=>`academic-assisted/courses/${id}/teachers`),
];
export function resolveModuleRoute(segments:string[],method:Verb,courseId:number):{path:string;form:boolean}|null {
  const input=segments.join('/');for(const spec of ROUTES){const match=input.match(spec.pattern);
    if(match&&spec.methods.includes(method))return {path:prefix+spec.to(match,courseId),form:!!spec.form};}
  return null;
}
