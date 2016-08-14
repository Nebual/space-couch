# Project Space Couch

## Running

```
git clone git@github.com:Nebual/space-couch.git
cd space-couch
npm install
npm run build
npm start
```
Then connect to http://[lan-ip-here]:8000/ from your phones

## Troubleshooting

###Can't connect
* Firewall? Open port 8000

###Game isn't fun
* Yeah its kinda early

###~~There's no stars~~ The stars don't move, this isn't space at all
* Working on it

## Design Principles
* Require cross-role coordination
* Encourage tunnel-vision
  * Each role has its own narrow focus, and isn't given sufficient information to 
  correctly make decisions without information from other roles (or the captain)
* Roles should all have small amounts of downtime

## Todo
* Backend
  * [X] Saves/restores client state between refreshes/disconnects
  * [ ] Saves/restores server state between server reboots/crashes
* Engineer
  * [X] Many swipe-navigable panels, categorized
  * Tons of knobs, buttons, and dials
  * Max Watts (capacity) sliders for subsystems
  * Max Volts (strength) sliders for subsystems
  * Everything is poorly labeled - can vary according to the Model # of the module (which changes when upgraded, and each game start will have different default models)
    * Protogen's Thor Sublight Thrusters have a 'T Inhibitor' (inverse max capacity) and a 'T Coefficient' (voltage) sliders,
    * Far Horizon's Calibrus Thrusters use a pair of 'T Cap A' and 'T Cap B' max capcity sliders, B must stay below A but are otherwise added together, along with a 'T Vlt' (voltage) slider
  * Has to manage temperature of the reactor core
* Robotics Expert
  * [X] Needs a map of the ship
  * [X] Directs robots over it to do things that need movement
  * Fire extinguishing
  * Repair
    * With spare part - fast, but takes system offline briefly, consumes part
    * With duct tape - slower, drops efficiency of system
  * Improving
    * Adding more power conduits (increases max that Engineer can set it to)
  * Move sensors
  * Move guns
  * Counter Intrusion
* Pilot?
  * Has local area map (in maneuverability thruster mode)
  * Has system map (in sublight mode)
  * Has to set the heading for Jumps
  * Turns via spinning giant wooden steering wheel
  * Has giant throttle lever, or https://img1.etsystatic.com/000/0/6355253/il_fullxfull.340992455.jpg
* Navigation
  * 3D gyroscoped panoramic parallax view of space, including constellations
  * To find where you are, you have to match visible constellations 
  with a database of known ones
    * Option a: Match against db of "Big Dipper is visible from 8 systems, 
    Cancer is visible from another 7, but both are only visible from 3, 
    that kinda looks like Leo, which would make it the Xenu system, unless
    that's the other constellation, in which case its the Abott system.
    Going with Xenu. Probably.
    * Have the same parallax stars view as Weapons
    * Have an overlayed list of constellations you can tick off upon finding them,
    which automatically narrows down the list of systems it could be. 
    List shows tiny thumbnails, can tap them to zoom in on a big picture of the constellation.
  * To find where you're going, you need a bearing...
  * Calculates the distance... math/pattern thing?
* Science (may merge into Navigation)
  * Analyzes ships that jump into radar range
    * Can mark as friend/foe, classify (size? capabilities? weapon types?)
  * Creates/improves maps (for uncharted systems)
  * Collects KSP-like science (earns money)
* Weapons
  * Reticle minigame
	  * [X] Stars background
	  * [ ] Parallax stars background according to gyro movement
  * Swipe to switch to different views (different gun mount points)
* Shields
  * Combat
  * Noncombat:
    * Asteroids
    * While in Warp
    * Radiation
  * Shield Emitters are in specific locations around the ship,
  emit a field that surrounds it but is more efficient closer to the emitter,
  so if the Port emitter goes down, the other ones can compensate inefficiently
* Captain
  * Mission details
  * Has inventory of spare parts
  * Has the JUMP button
* Overview Screen (TV)
  * Shows vague stats about the ship, just a very high level "this system is unpowered/overpowered/damaged"
  * Mission countdown clock
  * Displays alerts
    * damage taken
    * Systems offline
    * New ship detected on radar
    * "Mission Complete"
