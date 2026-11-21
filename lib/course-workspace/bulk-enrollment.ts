/** Validación conservadora para matrícula de usuarios nuevos o existentes del mismo tenant.
 * Nunca asociar una identidad únicamente porque coincida un username.
 */
export type CourseRole='STUDENT'|'TEACHER';
export type ImportPerson={username:string;password:string;firstname:string;lastname:string;idnumber:string;email:string;phone_number:string;province:string;role_code:CourseRole};
export type KnownPerson={id:number;username:string;firstname:string;lastname:string;idnumber:string|null;email:string|null;is_active:boolean};
export const headersSpanish=['Usuario','Contraseña','Nombres','Apellidos','Cédula','Correo','Teléfono','Provincia','Rol'] as const;
const clean=(v:string)=>v.trim().toLocaleLowerCase('es');
const idClean=(v:string)=>v.trim().toUpperCase();
export const blankPerson=():ImportPerson=>({username:'',password:'',firstname:'',lastname:'',idnumber:'',email:'',phone_number:'',province:'',role_code:'STUDENT'});
export function personError(v:ImportPerson):string|null{
  if(!v.username.trim()||v.username.length>150||!v.firstname.trim()||!v.lastname.trim())return 'Usuario, nombres y apellidos son obligatorios.';
  if(!v.idnumber.trim()||v.idnumber.length>100||!v.email.trim())return 'Cédula y correo son obligatorios en esta importación.';
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))return 'Correo electrónico inválido.';
  if(v.phone_number&&!/^\+?\d+$/.test(v.phone_number.trim()))return 'El teléfono debe contener solo números (y opcionalmente +).';
  if(!['STUDENT','TEACHER'].includes(v.role_code))return 'Rol inválido.';
  return null;
}
export function matchKnownUser(p:ImportPerson,users:KnownPerson[]):{user:KnownPerson|null;error:string|null}{
  const user=users.find(u=>clean(u.username)===clean(p.username));
  const collision=users.find(u=>u.id!==user?.id&&(
    (u.idnumber&&idClean(u.idnumber)===idClean(p.idnumber))||
    (u.email&&clean(u.email)===clean(p.email))));
  if(collision)return {user:null,error:'La cédula o el correo corresponden a otro usuario. Revisa la identidad.'};
  if(!user)return {user:null,error:null};
  if(!user.is_active)return {user:null,error:'El usuario encontrado está inactivo.'};
  if(clean(user.firstname)!==clean(p.firstname)||clean(user.lastname)!==clean(p.lastname)||
     !user.idnumber||idClean(user.idnumber)!==idClean(p.idnumber)||
     !user.email||clean(user.email)!==clean(p.email))
    return {user:null,error:'El usuario ya existe, pero sus datos personales no coinciden exactamente.'};
  return {user,error:null};
}
export function rowsFromSpanishTable(table:string[][]):ImportPerson[]{
  if(!table.length)return [];
  const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[\s_-]+/g,'').trim();
  const expected=['usuario','contrasena','nombres','apellidos','cedula','correo','telefono','provincia','rol'];
  const columns=expected.map(h=>table[0].findIndex(cell=>norm(cell)===h));
  if(columns.some((v,i)=>v<0&&i!==8))throw Error('El archivo debe contener: Usuario, Contraseña, Nombres, Apellidos, Cédula, Correo, Teléfono y Provincia (Rol es opcional).');
  const populated=table.slice(1).filter(row=>row.some(cell=>cell.trim()));
  if(populated.length>300)throw Error('La plantilla supera las 300 personas permitidas por lote.');
  return populated.map(row=>{
    const cell=(index:number)=>columns[index]<0?'':(row[columns[index]]||'').trim();
    const role=norm(cell(8));
    return {username:cell(0),password:cell(1),firstname:cell(2),lastname:cell(3),idnumber:cell(4),
      email:cell(5),phone_number:cell(6),province:cell(7),role_code:role==='profesor'||role==='teacher'?'TEACHER':role===''||role==='estudiante'||role==='student'?'STUDENT':role.toUpperCase() as CourseRole};
  });
}
