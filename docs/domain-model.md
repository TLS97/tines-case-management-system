# Domain model *(planned, update as built)*

```mermaid
classDiagram
  class SupervisionCase {
    id: GUID
    caseNumber: yyyy/nnnn
    status: CaseStatus
    field: Field
    departmentId: DepartmentId
    assignedTo: User?
    readAccess: User[]
  }
  class HealthPersonnel {
    id
    healthPersonnelNumber
    firstName
    surname
    reaction: HealthPersonnelReaction?
  }
  class Authorization {
    validFromDate
    validToDate?
    description
  }
  class Company {
    organizationNumber
    name
    description
    reaction: CompanyReaction?
  }
  class Address {
    streetName
    zipCode
    state
    country
  }
  class User {
    id
    firstName
    surname
    email
    isActive
    departmentId: DepartmentId
    role: Role
    primaryField: Field
    fields: Field[]
  }
  class FollowUpCase {
    <<planned>>
    dueDate
    findings
  }
  SupervisionCase "1" --> "*" HealthPersonnel
  SupervisionCase "1" --> "*" Company
  HealthPersonnel "1" --> "*" Authorization
  Company "1" --> "1" Address
  SupervisionCase "*" --> "0..1" User : assignedTo
  SupervisionCase "*" --> "*" User : readAccess
  HealthPersonnel "1" --> "0..1" FollowUpCase : RestrictionOfPractice
```

`FollowUpCase` belongs to F-010, which is still Draft *(planned)*.

- `CaseStatus`: Unassigned, Assigned, InProgress, Closed
- `HealthPersonnelReaction`: NoReaction, Prohibition, RestrictionOfPractice
- `CompanyReaction`: NoReaction, SelfAssessment
- `Field`: Health, Social, ChildServices
- `Role`: CaseWorker, Leader, Admin (one per user)
- `DepartmentId`: 1 Department of Supervision, 2 Department of Child Welfare, 3 Department of Business Management
