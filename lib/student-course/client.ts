import {requestJson,apiErrorMessage} from '@/lib/academic/client';
import {studentApi,type StudentOverview,type StudentGrades,type StudentEligibility,parseStudentOverview} from './domain';
export {apiErrorMessage};
export async function loadOverview(courseId:number):Promise<StudentOverview>{
  return parseStudentOverview(await requestJson(studentApi(courseId,'overview')),courseId);
}
export async function loadGrades(courseId:number):Promise<StudentGrades>{
  return await requestJson(studentApi(courseId,'grades')) as StudentGrades;
}
export async function loadEligibility(courseId:number):Promise<StudentEligibility>{
  return await requestJson(studentApi(courseId,'eligibility')) as StudentEligibility;
}
export async function action(courseId:number,segments:(string|number)[],method:'POST'|'PUT'|'PATCH',payload:unknown):Promise<unknown>{
  const body=payload instanceof FormData?payload:JSON.stringify(payload);
  return await requestJson(studentApi(courseId,...segments),undefined,{method,body,
    ...(payload instanceof FormData?{}:{headers:{'Content-Type':'application/json'}})});
}
