# Task: Implement Project Admin Features

## Goal
Implement functionality for the 4 "dead" buttons in the Project Admin Panel:
- **Resource Status**: Track employee project assignments and availability.
- **Strategic Overview**: High-level project portfolio health metrics.
- **Asset Deployment**: Register and track physical/digital assets.
- **Division Allocation**: Visualize resource/project distribution by department.

## Todo List
- [x] Create `AssetDeployment.jsx`
- [x] Create `DivisionAllocation.jsx`
- [x] Modify `ProjectStatus.jsx` -> "Resource Status"
- [x] Modify `ProjectDetails.jsx` -> "Strategic Overview"
- [x] Update `Projects.jsx`
    - [x] Import new components
    - [x] Update Tab labels
    - [x] Remove old "Team" and "Department" imports if unused

## Summary of Changes
- Created `AssetDeployment.jsx` with an asset registry table and registration modal.
- Created `DivisionAllocation.jsx` with allocation charts and division metrics.
- Transformed `ProjectStatus.jsx` into a resource status tracker with bench/active stats.
- Transformed `ProjectDetails.jsx` into a strategic overview with health metrics and risk assessment.
- Updated `Projects.jsx` to direct the new tabs to the new components.
