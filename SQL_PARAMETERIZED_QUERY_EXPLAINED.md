# SQL Parameterized Queries Explained

This document explains what a SQL parameterized query is, why it matters, and how this project uses the idea in practice.

It is written in two styles at the same time:

- high-level and detailed for technical understanding
- simple enough to explain like you are 7 years old

## Big Picture

A parameterized query means:

- the SQL instruction is one thing
- the user data is a separate thing

That separation is important.

Instead of building SQL by gluing text together like this:

```sql
select * from events where id = 'some-user-value-here';
```

the system sends the query structure and the values separately.

So the database understands:

- "this is the command"
- "this is just data"

and it does **not** confuse user input with SQL code.

## The Simple Idea

Think of SQL like a form with blank boxes.

The query is the paper.
The parameters are the answers you write in the boxes.

Example:

- paper says: "Find the event where id = ___"
- parameter says: "put this event ID in the blank"

The user is only allowed to fill the blank.
The user is **not** allowed to rewrite the whole paper.

That is the heart of parameterized queries.

## Why Parameterized Queries Matter

Parameterized queries help with:

### 1. Safety

They protect against SQL injection.

SQL injection happens when user input is treated like SQL code instead of plain data.

Bad example idea:

- user types something tricky
- app pastes it directly into a SQL string
- database accidentally treats it like instructions

Parameterized queries stop that by keeping values separate from the SQL command itself.

### 2. Correctness

Values are handled using their real types:

- `uuid`
- `text`
- `boolean`
- `integer`
- `timestamp`

That makes the database logic more predictable.

### 3. Maintainability

The SQL becomes easier to read because the structure stays stable.

Instead of one giant text string, you can clearly see:

- the query logic
- the inputs
- the validation

### 4. Better validation flow

When values come in as parameters, the database can validate them cleanly before writing anything.

This project does that a lot.

### 5. Better architecture

The app can send "what happened" to the database:

- event ID
- email
- municipality
- barangay ID

Then the database function decides:

- whether it is valid
- whether the row already exists
- whether to insert
- whether to update
- what status fields should be set

## The Main Idea In This Project

In this project, parameterized query behavior appears mostly in two practical forms:

### 1. Supabase RPC calls to SQL functions

The frontend calls database functions and passes named values.

For example, the app calls:

- `register_for_event_portal`
- `register_for_program_portal`
- `retry_registration_sync`
- `track_citizen_ticket`

Those functions accept parameters like:

- `p_event_id`
- `p_full_name`
- `p_email`
- `p_contact_number`
- `p_municipality`
- `p_barangay_id`

### 2. Supabase query-builder filters

The frontend also uses methods like:

- `.eq("id", value)`
- `.order("registered_at", { ascending: false })`
- `.limit(1)`

These are not raw string concatenation either.

They are structured API calls where the value is passed separately from the query intent.

So even when the code is not writing raw SQL text directly, it is still following the same safe principle:

- query structure stays separate from user data

## Real Project Example: Event Registration RPC

The frontend sends a registration like this in concept:

```ts
await supabase.rpc("register_for_event_portal", {
  p_event_id: eventId,
  p_full_name: cleanedInfo.fullName,
  p_email: cleanedInfo.email,
  p_contact_number: cleanedInfo.contactNumber,
  p_municipality: cleanedInfo.municipality,
  p_barangay_id: barangayId,
});
```

What this means:

- the app is not building a raw SQL string
- it is calling a known SQL function
- it is giving named inputs to that function

Then inside PostgreSQL, the function receives those values as safe parameters.

The SQL logic can then do things like:

- check if `p_event_id` is missing
- normalize the phone number
- validate the email
- find the event row
- insert or update the registration row

This is a very clean parameterized pattern.

## Real Project Example: Track Ticket RPC

Another good example is:

```ts
await supabase.rpc("track_citizen_ticket", {
  _reference_no: referenceNo,
  _requester_email: requesterEmail,
});
```

The SQL function then uses those parameters to filter safely:

```sql
where lower(t.reference_no) = lower(_reference_no)
  and lower(t.requester_email::text) = lower(_requester_email)
```

This is a nice example because it shows that parameterized queries are not only for inserts and updates.
They are also for safe lookups.

## What "Parameterized" Looks Like In SQL Functions

Here is the basic shape:

```sql
create or replace function public.some_function(
  p_id uuid,
  p_name text
)
returns void
language plpgsql
as $$
begin
  update public.some_table
  set name = p_name
  where id = p_id;
end;
$$;
```

Important idea:

- `p_id` and `p_name` are inputs
- they are values, not query text
- the SQL structure stays fixed

The function can use those parameters safely in:

- `where` clauses
- `insert values`
- `update set`
- validation checks
- conditional logic

## How This Helps The Registration Flow

In the registration system, the parameterized approach gives the database control over business rules.

For example, in `register_for_event_portal`, the function can safely use parameters to:

- make sure the user is authenticated
- make sure the event exists
- reject invalid email or phone number
- reject closed or full events
- decide whether sync should start as `pending` or `skipped`
- insert a new row or update an existing one

That is much safer than trusting the frontend to assemble a raw SQL statement correctly.

## What Would Be Risky Instead

This is the kind of pattern we do **not** want:

```ts
const sql = "select * from citizen_tickets where reference_no = '" + userInput + "'";
```

Why it is bad:

- user input is mixed into the SQL text itself
- quotes can break the query
- malicious input can try to change the meaning of the command
- validation becomes messy

Even if nobody is attacking, this style is still fragile and harder to maintain.

## The "Like I Am 7 Years Old" Version

Imagine a robot librarian.

You want the robot to find a book.

There are two ways to talk to the robot.

### Bad way

You say:

"Robot, here is a whole sentence I made up. Please do exactly what it says."

That is risky because your sentence might be messy, confusing, or sneaky.

### Good way

The robot has a card that already says:

"Find the book with ID = ___"

Then you only give one thing:

- the book ID

So the robot keeps the rule card the same and only fills in the blank.

That is what a parameterized query does.

The database says:

- "I know the rule already."
- "Just give me the values for the blanks."

## How The Project Uses "Blanks"

In this project, the blanks are things like:

- event ID
- program ID
- full name
- email
- contact number
- municipality
- barangay ID
- ticket reference number

The SQL function already knows what to do with those blanks.

It decides:

- where to look
- what to compare
- what to insert
- what to update

So the app gives data.
The database keeps the rules.

That is a very good team-up.

## High-Level Technical Breakdown

Here is the important architectural pattern:

### Step 1. Frontend collects input

Example:

- user enters name
- user enters email
- user picks an event

### Step 2. Frontend sends named parameters

The frontend sends a structured object to `supabase.rpc(...)`.

That object maps to function parameters in PostgreSQL.

### Step 3. PostgreSQL receives typed inputs

The SQL function defines the expected inputs:

- `uuid`
- `text`
- maybe default `null`

This gives the database a stable contract.

### Step 4. SQL function validates inputs

It can check:

- missing values
- invalid formats
- business rules

### Step 5. SQL function executes safe SQL statements

It uses the parameters in:

- `select ... where id = p_event_id`
- `insert into ... values (..., p_email, ...)`
- `update ... set municipality = p_municipality`

### Step 6. SQL function returns a result

For example:

- a new registration ID
- a row result
- `void`

## Important Detail: Parameters Are Not Magic By Themselves

Using parameters is very important, but it does not automatically solve every problem.

You still need:

- validation
- authorization
- constraints
- careful function design

This project does that too.

Examples:

- checking `auth.uid()` before allowing an action
- validating email format
- validating PH mobile number format
- checking whether the event exists
- checking whether the current user has admin/staff/SK role before retrying sync

So the strong pattern is:

- parameterized inputs
- plus validation
- plus permissions
- plus database constraints

## Query Builder As A Safe Middle Layer

In the frontend, many reads and writes use the Supabase query builder instead of handwritten SQL.

Examples:

- `.from("event_registrations").select("id").eq("user_id", user.id).eq("event_id", eventId)`
- `.from("program_registrations").update({...}).eq("id", existing.data.id)`

This follows the same idea.

The code is saying:

- use this table
- apply this filter
- use this value

instead of:

- build a giant SQL string by hand

So even though it does not look like raw SQL with `$1`, `$2`, or `?`, it still keeps values structured and separated.

## How Parameterized Queries Help Security

The most famous security reason is SQL injection prevention.

Here is the high-level rule:

- if user input becomes part of SQL code, that is dangerous
- if user input is treated only as data, that is much safer

Parameterized queries make it far harder for an attacker to turn normal input fields into database instructions.

## How Parameterized Queries Help Reliability

They also help normal users, not just security.

For example:

- names with apostrophes are safer to handle
- email addresses stay plain values
- UUIDs are checked as UUIDs
- null handling is cleaner
- updates are easier to reason about

## A Good Mental Model

Use this simple mental model:

- SQL code is the recipe
- parameters are the ingredients

You do not let the ingredients rewrite the recipe.

You only place the ingredients into the recipe's slots.

## In This Project, The Best Examples Are

### Registration functions

- `register_for_event_portal(...)`
- `register_for_program_portal(...)`

These accept user-provided registration values as parameters and apply validation plus business rules before writing.

### Ticket tracking function

- `track_citizen_ticket(_reference_no, _requester_email)`

This safely looks up a ticket based on supplied values.

### Retry sync function

- `retry_registration_sync(p_kind, p_registration_id)`

This takes controlled inputs, checks permissions, and updates only the intended registration row.

## Important Distinction: Static SQL vs Runtime Input

Not every SQL statement needs parameters.

For example, migration files contain many fixed schema commands like:

- `alter table`
- `create index`
- `add column`

Those are static setup commands written by developers.

The real place where parameterization matters most is runtime behavior:

- user input
- filters
- lookups
- inserts
- updates
- RPC calls

So the key question is:

"Does this SQL depend on outside input?"

If yes, that input should be passed safely as data, not pasted into the SQL text.

## One-Sentence Summary

A SQL parameterized query means the database keeps the command and the user values separate, which makes the system safer, cleaner, and easier to control, and this project uses that pattern heavily through Supabase RPC functions and structured query-builder calls.
