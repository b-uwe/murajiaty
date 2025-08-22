# Claude Code Instructions

## MANDATORY Instructions CLAUDE MUST FOLLOW IN ALL CASES
⚠️ **CRITICAL: These are MANDATORY, not optional guidelines. Claude MUST NOT bypass these:**
**NO EXCEPTIONS. NO SHORTCUTS. NO "I'll fix it later".**

### EVERY CHANGE DONE TO THE REPOSITORY consists of the following 16 steps:
**NO EXCEPTIONS. NO SHORTCUTS. NO SKIPPING STEPS.**
#### 📋 Planning Phase (Steps 1-4)
  1. Ensure full comprehension of the task at hand! NEVER ASSUME! Ask back, in case! Ask back ONCE AT THIS STEP, not constantly throughout the process!
  2. Check out the main branch freshly, MAKE SURE you're not accidentally working on an old feature branch, pull to make sure you have the latest version
  3. Create a feature or bug report branch! NEVER work on the main branch
  4. Break down the task into subtasks

  #### 🔧 Preparation Phase (Steps 5-8)
  5. Familiarize yourself with the Coding style outlined in eslint.config.mjs, so that you do it right from the beginning and not have to change after running linting tests. Do that WITH CARE and MEMORIZE those rules!
  6. Identify the regions of the code you need to work on
  7. Analyze those regions for possible cleanups and improvements according to the Boy Scout rule, explained further below. If there's potential for cleanup, do it AT THIS POINT! NO DELAYING IT! **MANDATORY: Create a 
  separate commit for ANY cleanup with "Boy Scout: " prefix.** Then **MANDATORILY** run linting checks AND run all tests and fix issues over and over again until all checks and tests pass. Then commit according to below boyscout rule instructions. NEVER EVER commit code with failing tests or linting errors!
  8. Define what can be tested and WRITE THE TESTS BEFORE writing the implementation! WE WANT TO WORK TEST-FIRST! For EVERY LINE of code that changes BUSINESS LOGIC and can realistically be tested, write a test. Skip only: CSS-only changes, documentation, configuration files, or pure UI markup without logic. ENSURE NO BREAKING BUSINESS LOGIC WHENEVER POSSIBLE! MAKE SURE your tests really test productive code!

  #### 🔨 Implementation Phase (Steps 9-12)
  9. Do the changes! **COMMIT AFTER EACH LOGICAL STEP**, **EACH COMMIT MUST:**
     * Be a complete, working intermediate step
     * Pass ALL linting checks with `npm run lint`
     * Pass ALL tests with `npm test`
     * Have NO errors or warnings
     * **MINIMUM 3-5 commits expected for any non-trivial feature**
  10. If main.js has changed, update its inclusion in index.html. Use a unix timestamp to prevent caching.
  11. Identify the regions that were just changed
  12. Repeat step 7 and EXPLICITLY clean up! READ step 5 CLOSELY at this point to not miss anything
  13. Run linting and testing once more. ENSURE NO ERRORS AND NO WARNINGS!

  #### 🚀 Delivery Phase (Steps 13-15)
  14. Push the changes to the repository! Then create a PR!
  15. After creating a PR, check for merge conflicts and try to fix as much as you can locally, MANDATORILY ENSURE NO LINTING ERRORS AND ALL TESTS PASSING, then push updates. Repeat until there are no merge conflict that could be resolved
  16. Tick the boxes for "Delete source branch" and "Squash commits" for when the PR is accepted. Assign the PR to b-uwe!

## Project Overview
A simple spaced repetition vocabulary trainer for learning Arabic.

## Project Descrition
See README.md

## Key Architecture
- Single-page application with Vanilla JavaScript
- Two Core Server Components:
  1. TTS Audio Proxy (proxy/proxy.php)
    - Purpose: Bypass CORS restrictions for Google Translate TTS
    - Caching: Local file-based cache using MD5 hashes
    - Stateless: Each request is independent
    - Simple routing: Single GET parameter (?text=)
  2. Static File Server
    - Web server: Serves HTML/CSS/JS assets
- Vocabulary Data Source:
  - Google Sheets: Primary vocabulary source via CSV export
  - localStorage: Client-side persistence for offline use

## Tech Stack
- Vanilla JavaScript (no frameworks)
- CSS Grid for responsive layout
- localStorage for offline persistence
- PHP for the server parts

## Development Commands
- `npm test` - Run Jest unit tests
- `npm run lint` - Run ESLint checks

## General instructions
- Branch names: Use descriptive names, no specific convention required
- For the PR, tick the boxes for "Delete source branch" and "Squash commits" for when the PR is accepted.
- This is a GitHub repository, so use the `gh` tool for PRs
- Commit in smaller steps, but always with something that works and has been tested

## Boy Scout rule
- "Leave your code better than you found it."
- Consider each and every change a chance to clean up the code a little, in small and easy steps
- Clean up and improve the exact blocks you want to touch in your coding before you start - again, just the small changes
- Create a separate git commit for this, prefix the commit message with "Boy Scout: "
- Then do the actual task, and create one or more commits for it
- Then have a look at those code blocks that interact with what you just changed or created, do small improvements there, and commit them with a commit message prepended with "Boyscout: "

## Code Style and documentation
- Configuration is in eslint.config.js
- Use jsdoc for all functions and variables. Apply the Boy Scout rule when you work on undocumented or wrongly/badly documented blocks!
- Work with Vanilla JS! No libraries! Consider challenging that for very lightweight ones (<20KB minified, zero dependencies preferred), but be very conservative in general
- Aim for 80%+ test coverage but don't mock everything - prefer real implementations when feasible.
- ENSURE YOUR TESTS MAKE SENSE AND YOU DON'T TEST 100% MOCKS!

## Code Reviewing
- Be critic and be direct. Not aggressive, but no need for being political
- Never review your own code, of course.

## Limitations
- Testing only happens on a unit test level. Feel free to carefully challenge that, but avoid heavy testing libraries and too much mocking. NO UI Testing!
