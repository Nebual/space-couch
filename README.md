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

###There's no stars, this isn't space at all
* Working on it

## Todo
* Engineer
  * Tons of knobs, buttons, and dials
  * Max Watts (capacity) sliders for subsystems
  * Max Volts (strength) sliders for subsystems
  * Has to manage temperature of the reactor core
* Robotics Expert
  * Needs a map of the ship
  * Directs robots over it to do things that need movement
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
  * To find where you're going, you need a bearing...
  * Calculates the distance... math/pattern thing?
* Weapons
  * Reticle minigame
  * Parallax stars background (gyro)
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
  * Overview Screen
  * Has inventory of spare parts
  * Has the JUMP button
