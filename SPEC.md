# Specification

## Domain model

### SupervisionCase
| Field | Type | Notes |
|---|---|---|
| id | GUID | Set on create |
| caseNumber | string | `yyyy/nnnn`, e.g. `2026/0042`, set on create. See [Case number](#case-number) |
| status | `CaseStatus` | `Unassigned` on create. See [Case status](#case-status) |
| field | Field | Defaults to the creator's primary field; must be one of the creator's fields |
| departmentId | DepartmentId | Set to the creating leader's department; cannot be changed |
| assignedTo | User id \| null | `null` on create |
| readAccess | User id[] | Case workers given read access by a leader; empty on create |
| healthPersonnel | HealthPersonnel[] | |
| companies | Company[] | |

### Case number
- Format `yyyy/nnnn`: `yyyy` is the year the case is created, `nnnn` is a sequence zero-padded to 4 digits.
- The sequence starts at `0001` every year.
- There is one sequence for all departments, so no two cases ever have the same case number.

### Case status
`CaseStatus` = `Unassigned` | `Assigned` | `InProgress` | `Closed`

| From | To | When | Who |
|---|---|---|---|
| (new) | `Unassigned` | Case is created | Leader |
| `Unassigned` | `Assigned` | Case is assigned to a case worker | Leader |
| `Assigned` / `InProgress` | (unchanged) | Case is reassigned to another case worker | Leader |
| `Assigned` | `InProgress` | The assigned case worker makes their first change to the case (opening it does not count) | CaseWorker |
| `InProgress` | `Closed` | Close button; only allowed when the case has at least one health personnel or company and every one of them has a reaction | Assigned CaseWorker |
| `Closed` | `InProgress` | Reopen button | Leader |

A `Closed` case cannot be changed by anyone (no edits, assignment or read access changes) until a leader reopens it.

### HealthPersonnel
`id`, `healthPersonnelNumber`, `firstName`, `surname`, `authorizations: Authorization[]`, `reaction?: HealthPersonnelReaction`

- `healthPersonnelNumber`: 7 to 9 digits, digits only (no spaces or other characters).

### Authorization
`validFromDate`, `validToDate: date | null`, `description`

- `validToDate` is optional and `null` initially.

### Company
`id`, `organizationNumber`, `name`, `description`, `address: Address`, `reaction?: CompanyReaction`

### Address
`streetName`, `zipCode`, `state`, `country`

### Reactions
| Reaction | Health personnel | Company |
|---|---|---|
| `NoReaction` | ✓ | ✓ |
| `Prohibition` | ✓ | |
| `RestrictionOfPractice` | ✓ | |
| `SelfAssessment` | | ✓ |

- `HealthPersonnelReaction` = `NoReaction` | `Prohibition` | `RestrictionOfPractice`
- `CompanyReaction` = `NoReaction` | `SelfAssessment`

A case can give different reactions to each health personnel and company in it.

### Field
`Health` | `Social` | `ChildServices`

Case workers work within one or more fields and supervise health personnel or social
workers in institutions such as hospitals, clinics and children's institutions.

### Department
| DepartmentId | Name |
|---|---|
| 1 | Department of Supervision |
| 2 | Department of Child Welfare |
| 3 | Department of Business Management |

### User
`id`, `firstName`, `surname`, `email`, `isActive`, `createdAt`, `updatedAt | null`, `departmentId: DepartmentId`, `role: Role`, `primaryField: Field`, `fields: Field[]` (always includes `primaryField`)

- `Role` = `CaseWorker` | `Leader` | `Admin`. Each user has exactly one role.

### Sensitive case data
Hidden from Admin (see Permissions). The mock API leaves it out of responses to Admin; the UI does not just hide it.
- Health personnel identity: `healthPersonnelNumber`, `firstName`, `surname`
- Authorizations
- Company details: `organizationNumber`, `name`, `description`, `address`
- Reactions

Admin still sees: case number, status, field, department and assigned case worker.

## Mock API and data
- v1 uses only the MSW mock API. All data (cases, users, audit log) is saved in `localStorage`,
  so it is still there after a page reload.
- On first load, or when `localStorage` is empty, the mock API loads the seed data below.
- A **Reset mock data** action (mock only) clears `localStorage` and loads the seed data again.
- A **user switcher** in the header (mock only) lets you act as any seed user. The chosen user
  is saved in `localStorage`. Default user: Tine Tester.

## Seed data
All users are active and fake. Emails use `example.com`.

| Name | Email | Role | Department | Primary field | Fields |
|---|---|---|---|---|---|
| Ingrid Halvorsen | ingrid.halvorsen@example.com | Leader | 1 Supervision | Health | Health, Social |
| Tine Tester | tine.tester@example.com | CaseWorker | 1 Supervision | Health | Health |
| Magnus Berg | magnus.berg@example.com | CaseWorker | 1 Supervision | Health | Health, Social |
| Sofie Lunde | sofie.lunde@example.com | CaseWorker | 1 Supervision | Social | Social |
| Henrik Aasen | henrik.aasen@example.com | CaseWorker | 1 Supervision | Health | Health |
| Nora Strand | nora.strand@example.com | CaseWorker | 1 Supervision | Social | Social, Health |
| Kari Solberg | kari.solberg@example.com | Leader | 2 Child Welfare | ChildServices | ChildServices, Social |
| Emil Haugen | emil.haugen@example.com | CaseWorker | 2 Child Welfare | ChildServices | ChildServices |
| Ida Moen | ida.moen@example.com | CaseWorker | 2 Child Welfare | ChildServices | ChildServices, Social |
| Jonas Eide | jonas.eide@example.com | CaseWorker | 2 Child Welfare | Social | Social |
| Thea Bakken | thea.bakken@example.com | CaseWorker | 2 Child Welfare | ChildServices | ChildServices |
| Sander Lie | sander.lie@example.com | CaseWorker | 2 Child Welfare | Social | Social, ChildServices |
| Erik Nygård | erik.nygard@example.com | Leader | 3 Business Management | Health | Health, Social, ChildServices |
| Maja Dahl | maja.dahl@example.com | CaseWorker | 3 Business Management | Health | Health |
| Andreas Holm | andreas.holm@example.com | CaseWorker | 3 Business Management | Social | Social |
| Emma Vik | emma.vik@example.com | CaseWorker | 3 Business Management | ChildServices | ChildServices |
| Oskar Ruud | oskar.ruud@example.com | CaseWorker | 3 Business Management | Health | Health, ChildServices |
| Hanna Sæther | hanna.saether@example.com | CaseWorker | 3 Business Management | Social | Social, Health |
| Lars Johansen | lars.johansen@example.com | Admin | 1 Supervision | Health | Health |

User ids are fixed GUIDs in the seed file. No cases are seeded.

## Permissions
"Own department" means the case's department is the user's department.

| Action | CaseWorker | Leader | Admin |
|---|---|---|---|
| See cases in overview | Assigned to them or given read access | All in own department | All (restricted) |
| Create case | | Own department, own fields only | |
| Read case (full) | Assigned to them or given read access | All in own department | |
| Read case (restricted, sensitive data hidden) | | | All departments |
| Edit case | Assigned to them, not `Closed` | | |
| Close case | Assigned to them | | |
| Reopen closed case | | Own department | |
| Assign / reassign case | | Own department | |
| Give / remove read access | | Own department | |
| View audit log per case | | Own department | |
| View global audit log (filter: case id, action, user, result, date) | | | ✓ |
| Add users, deactivate and reactivate users, change a user's fields and department | | | ✓ |

## Features

**Status rules:** a feature moves Draft → Approved → In progress → Done.
- **Draft**: not accepted yet (criteria may be missing); do not build.
- **Approved**: acceptance criteria accepted by Tine; may be built when Tine says to start a task.
- **In progress**: at least one build-plan task for it has been started.
- **Done**: all its build-plan tasks are merged.

Only Tine moves a feature from Draft to Approved, and only Tine changes acceptance criteria.
Claude may set **In progress** in the feature's first PR and **Done** in its last PR, so Tine sees it in review.

| ID | Feature | Status |
|---|---|---|
| F-001 | Create supervision case | Done |
| F-002 | Expand supervision case (field, personnel, companies, reactions, close) | Done |
| F-003 | Case overview with filters (field, status, reaction) | Done |
| F-004 | RBAC: users, roles, permissions | In progress |
| F-005 | Audit log | In progress |
| F-006 | Generate Word documents | Draft |
| F-007 | Excel export of non-sensitive data | Draft |
| F-008 | Create an application | Draft |
| F-009 | Applications in the case overview | Draft |
| F-010 | Follow-up case | Draft |
| F-011 | Follow-up in the case overview | Draft |
| F-012 | Notifications to leaders | Draft |

### F-001 Create supervision case *(Approved 2026-10-17)*
- Only leaders can create cases. The "New case" button is hidden for other roles, and the mock API rejects it.
- **Given** a leader **when** they submit the new case form **then** a case is created with a GUID id,
  the next case number (see [Case number](#case-number)), status `Unassigned`, `assignedTo: null`
  and the leader's own department.
- The field selector is preset to the leader's primary field and only lists fields the leader has access to.
- **Given** a leader without access to a field **then** they cannot create a case in that field
  (option not shown, and the mock API rejects it).
- After creating the case, the leader lands on the case detail page, where they can assign it (F-004).

### F-002 Expand supervision case *(Approved 2026-10-17)*
- The case detail page shows case number, status, field, department, assigned case worker,
  health personnel and companies.
- The assigned case worker can edit field, health personnel, companies and reactions.
  The field can only be changed to one of the assigned case worker's fields. The department cannot be changed.
- A health personnel can be added with health personnel number (7 to 9 digits, digits only),
  first name, surname and one or more authorizations.
- An authorization needs `validFromDate`. `validToDate` is optional and empty initially; if set, it must be on or after `validFromDate`.
- A company can be added with organization number (9 digits), name, description and address
  (street name, zip code, state, country).
- The same health personnel (same health personnel number) or company (same organization number)
  cannot be added to a case more than once.
- Health personnel and companies can be removed from the case.
- Each health personnel gets one reaction: `NoReaction`, `Prohibition` or `RestrictionOfPractice`.
- Each company gets one reaction: `NoReaction` or `SelfAssessment`.
- The reaction selector only offers the reactions allowed for that party.
- The assigned case worker's first change to an `Assigned` case sets the status to `InProgress`.
- The assigned case worker sees a **Close case** button. It only works when the case has at least
  one health personnel or company and every one of them has a reaction; otherwise the page says
  what is missing. Closing sets the status to `Closed`.
- A `Closed` case is read-only for everyone.
- Everyone else with access sees the case read-only. Admin sees the restricted view
  (see [Sensitive case data](#sensitive-case-data)).
- Every change is written to the audit log (F-005).

### F-003 Case overview *(Approved 2026-10-17)*
- Shows case number, field, status, assigned case worker and reactions. Admin does not see reactions, but sees
  each case's department.
- CaseWorker sees cases assigned to them and cases they have read access to; Leader sees all cases
  in their department; Admin sees all cases.
- Filters: field, status, reaction. A case matches a reaction filter if any health personnel or
  company in it has that reaction. Admin has no reaction filter. Filters can be combined and cleared.
- Empty result shows a clear "No cases match the filters" message.

### F-004 Access control *(Approved 2026-10-17)*
- Each user has exactly one role.
- Every action in the permissions table is checked through `can()`; hidden in the UI and rejected by the mock API.
- Leader can assign an `Unassigned` case in their department. Status becomes `Assigned`.
- Leader can reassign an `Assigned` or `InProgress` case in their department. Status does not change.
- A case can be assigned to an active case worker who has access to the case's field, either from the leader's
  own department or **borrowed** from another department. A leader can borrow the same case worker for as many
  cases as needed; the case worker's home department does not have to approve.
- A borrowed case worker works on the case exactly like on their own cases. Borrowing gives them no other access
  in that department. The case page shows a borrowed case worker's home department next to their name.
- The leader of a case worker's home department sees a short read-only "Lent out" list on their Cases page: their
  case workers' cases (not `Closed`) in other departments, with case number, department and case worker.
- Leader can give an active case worker in their department read access to a case in their department, and remove it.
- Leader can reopen a `Closed` case in their department. Status becomes `InProgress`.
- A `Closed` case cannot be assigned, reassigned or have its read access changed.
- Admin can open any case in any department in the restricted view
  (see [Sensitive case data](#sensitive-case-data)).
- Admin can add a user with all User fields; email must be unique.
- Admin can deactivate a user, reactivate a deactivated user, change which fields a user has access to, and change
  a user's department. `fields` must always include `primaryField`; to remove the primary field, Admin picks a new
  primary field first.
- Changing a user's fields does not change their cases: they stay assigned even to a case whose field they no
  longer have.
- Moving a user to another department is permanent and only possible when they are not the assigned case worker of
  any case (not `Closed`) in their current department. Until then, the Users page lists those cases so a leader can
  reassign them first. Cases they are borrowed for in other departments are not affected. Read access they had to
  cases in their old department is removed when they move.
- Inactive users cannot be assigned cases or given read access.
- Deactivating a user does not remove them from their cases: `assignedTo` keeps the deactivated
  case worker, so the case history stays correct. The UI shows them as "(deactivated)".
- Leader can reassign a case whose assigned case worker is deactivated to an active case worker
  (same rules as any reassignment). The deactivated case worker is then replaced, and the change
  is logged in the audit log.
- When a case in a leader's department is not `Closed` and its assigned case worker is deactivated,
  the leader sees a notification in a short list at the top of their Cases page. It links to the case and
  disappears when the case is reassigned to an active case worker. When F-012 is built, this notification is
  shown together with F-012's notifications.

### F-005 Audit log *(Approved 2026-10-17)*
Logged actions: case created, case updated, case assigned, status changed, reaction given,
read access granted/removed, case opened, user added, user updated.
Each entry: `id`, `timestamp`, `userId`, `action`, `caseId?`, `result` (`Success` | `Denied`), `details`.
`details` never contains [sensitive case data](#sensitive-case-data); refer to health personnel and companies by their `id`.
For "case assigned", `details` holds the previous case worker's id (if any) and the new one's, and for a borrowed
case worker their home department.
Leader sees entries for one case in their department; Admin sees all, filtered by case id, action, user, result and date.

### F-006 Generate Word documents *(Draft)*
No acceptance criteria yet.

### F-007 Excel export *(Draft)*
List the exact fields that count as non-sensitive. Until then, nothing is exported.

### F-008 Create an application *(Draft)*
No acceptance criteria yet.

### F-009 Applications in the case overview *(Draft)*
No acceptance criteria yet.

### F-010 Follow-up case *(Draft)*
- When a reaction is `RestrictionOfPractice`, a follow-up case is created with a first due date.
- At the due date the case worker records whether conditions were followed, adds findings,
  and sets a new due date on the same follow-up case. Repeats until closed.

### F-011 Follow-up in the case overview *(Draft)*
No acceptance criteria yet.

### F-012 Notifications *(Draft)*
- When a case in a leader's department is `Unassigned`, the leader sees a notification in the app.
- The notification links to the case and disappears when the case is assigned.
- Notifications about cases with a deactivated case worker are part of F-004 (built in T3.5) and are
  shown together with the notifications here.
