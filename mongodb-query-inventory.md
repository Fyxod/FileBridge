# MongoDB Query Inventory

This file lists the MongoDB/Mongoose calls in this project and groups the runtime queries by query type.

Reference links use local absolute paths with line numbers. In editors or Markdown viewers that support local line links, clicking a reference should open the file at that line.

## 1) Simple Find Queries

These queries read one or more documents using direct field matching, ID lookup, text/regex lookup, or basic `$or` logic.

| Reference | Query / part | Explanation |
|---|---|---|
| [middleware/auth.js:5](<c:/Users/parth/Desktop/DE project/main_project/middleware/auth.js:5>) | `User.findById(req.session.userId).lean()` | Loads the logged-in user from the session ID and stores it in `res.locals.currentUser`. `.lean()` returns a plain object instead of a full Mongoose document. |
| [controllers/authController.js:22](<c:/Users/parth/Desktop/DE project/main_project/controllers/authController.js:22>) | `User.findOne({ $or: [{ userId }, { email }] })` | Checks whether a user ID or email already exists before registration. |
| [controllers/authController.js:65](<c:/Users/parth/Desktop/DE project/main_project/controllers/authController.js:65>) | `User.findOne({ $or: [{ userId }, { email }] })` | Finds a user during login by either user ID or email before password verification. |
| [controllers/userController.js:14](<c:/Users/parth/Desktop/DE project/main_project/controllers/userController.js:14>) | `User.find({ userId: regex }).select("userId name").limit(10).lean()` | Powers user autocomplete/search. It matches user IDs by prefix, returns only `userId` and `name`, limits output to 10, and returns lean objects. |
| [controllers/groupController.js:80](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:80>) | `Group.findById(req.params.id)` | Loads a group before adding a member so the controller can verify the group exists and the current user owns it. |
| [controllers/groupController.js:93](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:93>) | `User.findOne({ userId: memberUserId })` | Finds the user being added to a group. |
| [controllers/groupController.js:113](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:113>) | `Group.findById(req.params.id)` | Loads a group before removing a member so ownership and existence can be checked. |
| [controllers/groupController.js:126](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:126>) | `User.findOne({ userId: memberUserId })` | Finds the user being removed from a group. |
| [controllers/groupController.js:147](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:147>) | `Group.findById(req.params.id)` | Loads a group before updating permissions so only the owner can make changes. |
| [controllers/fileController.js:259](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:259>) | `File.findById(req.params.id)` | Loads a file before deletion so the controller can verify it exists, check ownership, remove the physical file, and know its size. |
| [controllers/fileController.js:379](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:379>) | `File.findOne({ _id: req.params.id, owner: user._id })` | Loads an owned file before toggling its share link. The `owner` condition prevents non-owners from changing link access. |
| [controllers/fileController.js:423](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:423>) | `File.findById(req.params.id)` | Loads a file before authenticated download. Access is checked afterward in application logic. |
| [controllers/fileController.js:440](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:440>) | `File.findOne({ "access.shareToken": token, "access.visibility": "link" }).lean()` | Finds a file for the public share preview page. It requires both a matching token and `link` visibility. |
| [controllers/fileController.js:453](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:453>) | `File.findOne({ "access.shareToken": token, "access.visibility": "link" })` | Finds a file for public download through a share token. It requires the link to still be enabled. |

## 2) Simple Update Queries

These queries update scalar fields, nested fields, counters, or whole subdocuments without using array-specific operators like `$addToSet` or `$pull`.

| Reference | Query / part | Explanation |
|---|---|---|
| [controllers/fileController.js:247](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:247>) | `User.updateOne({ _id: user._id }, { $inc: { storageUsed: file.size } })` | Increases the uploader's storage usage after a successful file upload. |
| [controllers/fileController.js:277](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:277>) | `User.updateOne({ _id: user._id }, { $inc: { storageUsed: -file.size } })` | Decreases the owner's storage usage after a file is deleted. |
| [controllers/fileController.js:301](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:301>) | `File.updateOne({ _id: req.params.id, owner: user._id }, { $set: { name } })` | Renames a file. The owner condition ensures only the owner can rename it. |
| [controllers/fileController.js:319](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:319>) | `File.updateOne({ _id: req.params.id, owner: user._id }, { $set: { folderPath } })` | Moves a file to a virtual folder path. The owner condition restricts the action. |
| [controllers/fileController.js:367](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:367>) | `File.updateOne({ _id: req.params.id, owner: user._id }, update)` | Updates access visibility, allowed users/groups, and share token state. This is owner-only. |
| [controllers/fileController.js:386](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:386>) | `File.updateOne({ _id: file._id }, { $set, $unset })` | Turns an existing share link off by setting visibility to `private` and removing `access.shareToken`. |
| [controllers/fileController.js:395](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:395>) | `File.updateOne({ _id: file._id }, { $set: { visibility: "link", shareToken } })` | Turns a share link on by saving a new token and setting visibility to `link`. |
| [controllers/groupController.js:165](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:165>) | `Group.updateOne({ _id: group._id }, { $set: { permissions } })` | Replaces the group's permission flags after verifying the current user owns the group. |

## 3) Aggregation Queries

These queries use MongoDB aggregation pipelines for computed dashboard statistics.

| Reference | Pipeline | Explanation |
|---|---|---|
| [controllers/fileController.js:167](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:167>) | `File.aggregate([{ $match: { owner: user._id } }, { $group: { _id: "$owner", totalSize: { $sum: "$size" }, count: { $sum: 1 } } }])` | Calculates the current user's total owned file size and file count for dashboard storage stats. |
| [controllers/fileController.js:180](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:180>) | `File.aggregate([{ $match: { owner: user._id } }, { $group: { _id: "$mimeType", totalSize: { $sum: "$size" }, count: { $sum: 1 } } }, { $sort: { totalSize: -1 } }])` | Groups the current user's storage by MIME type and sorts the largest categories first. |

## 4) Array Find Queries

These queries search using array fields, `$in`, or array membership behavior.

| Reference | Query / part | Explanation |
|---|---|---|
| [controllers/fileController.js:22](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:22>) | `User.find({ userId: { $in: userIds } }, "_id").lean()` | Finds users whose `userId` is in the submitted list, then returns only `_id`s for file sharing rules. |
| [controllers/fileController.js:30](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:30>) | `Group.find({ name: { $in: groupNames }, members: memberId }, "_id").lean()` | Finds groups by submitted names, but only if the current user is already in the `members` array. Used when resolving share targets. |
| [controllers/fileController.js:37](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:37>) | `buildAccessQuery(user._id, groupIds)` with `$or` and `$in` | Builds file visibility rules: owner access, public access, direct user access through `access.allowedUsers`, and group access through `access.allowedGroups`. |
| [controllers/fileController.js:136](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:136>) | `filters.push({ $text: { $search: req.query.q } })` | Adds text search over indexed file names and tags when the dashboard search box is used. This feeds into the later `File.find(query)`. |
| [controllers/fileController.js:139](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:139>) | `filters.push({ tags: req.query.tag })` | Adds a tag filter. In MongoDB, matching `{ tags: value }` against an array field means "array contains this value." |
| [controllers/fileController.js:163](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:163>) | `File.find(query).sort(sort).lean()` | Executes the dashboard file listing query assembled from access rules, search, tag/type/folder/date filters, and sorting. |
| [controllers/fileController.js:164](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:164>) | `Group.find({ members: user._id }).lean()` | Finds all groups where the current user's ID appears in the `members` array. Used for suggestions and dashboard context. |
| [controllers/fileController.js:408](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:408>) | `User.exists({ _id: user._id, favorites: fileId })` | Checks whether the user's `favorites` array already contains the file ID before toggling favorite status. |
| [controllers/groupController.js:16](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:16>) | `Group.find({ members: req.session.userId }).populate("members", "userId name").lean()` | Lists groups where the current user is in the `members` array. `populate` fetches member details for display. |
| [controllers/groupController.js:44](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:44>) | `User.find({ userId: { $in: memberUserIds } }, "_id").lean()` | Finds all submitted group members in one query and returns only their Mongo `_id`s. |

## 5) Array Update Queries

These queries add to, remove from, or replace array fields.

| Reference | Query / part | Explanation |
|---|---|---|
| [controllers/fileController.js:281](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:281>) | `User.updateMany({ favorites: file._id }, { $pull: { favorites: file._id } })` | Removes a deleted file from every user's `favorites` array. |
| [controllers/fileController.js:336](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:336>) | `File.updateOne({ _id, owner }, { $set: { tags } })` | Replaces the file's entire `tags` array with the submitted list. |
| [controllers/fileController.js:347](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:347>) | `resolveUsers(...)` / `resolveGroups(...)` before access update | Resolves arrays of user IDs and group names into Mongo `_id` arrays before saving sharing permissions. |
| [controllers/fileController.js:367](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:367>) | `$set: { "access.allowedUsers": allowedUsers, "access.allowedGroups": allowedGroups }` | Replaces the allowed users/groups arrays for a file's access settings. |
| [controllers/fileController.js:410](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:410>) | `User.updateOne({ _id: user._id }, { $pull: { favorites: fileId } })` | Removes a file from the current user's favorites array. |
| [controllers/fileController.js:412](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:412>) | `User.updateOne({ _id: user._id }, { $addToSet: { favorites: fileId } })` | Adds a file to the current user's favorites array without creating duplicates. |
| [controllers/groupController.js:66](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:66>) | `User.updateMany({ _id: { $in: members } }, { $addToSet: { groups: group._id } })` | Adds the new group ID to every member's `groups` array. `$addToSet` prevents duplicates. |
| [controllers/groupController.js:98](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:98>) | `Group.updateOne({ _id: group._id }, { $addToSet: { members: user._id } })` | Adds a user to a group's `members` array without duplicates. |
| [controllers/groupController.js:102](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:102>) | `User.updateOne({ _id: user._id }, { $addToSet: { groups: group._id } })` | Adds the group reference to the user's `groups` array without duplicates. |
| [controllers/groupController.js:135](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:135>) | `Group.updateOne({ _id: group._id }, { $pull: { members: user._id } })` | Removes a user from the group's `members` array. |
| [controllers/groupController.js:136](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:136>) | `User.updateOne({ _id: user._id }, { $pull: { groups: group._id } })` | Removes the group reference from the user's `groups` array. |

## Other MongoDB / Mongoose Calls

These calls are still related to MongoDB, but they are not find, update, aggregation, or array-specific queries.

### Inserts

| Reference | Call | Explanation |
|---|---|---|
| [controllers/authController.js:37](<c:/Users/parth/Desktop/DE project/main_project/controllers/authController.js:37>) | `User.create({...})` | Inserts a new user document during registration. |
| [controllers/fileController.js:234](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:234>) | `File.create({...})` | Inserts file metadata after upload. |
| [controllers/fileController.js:248](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:248>) | `ActivityLog.create({...})` | Inserts an upload activity log. |
| [controllers/fileController.js:285](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:285>) | `ActivityLog.create({...})` | Inserts a delete activity log. |
| [controllers/fileController.js:305](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:305>) | `ActivityLog.create({...})` | Inserts a rename activity log with metadata. |
| [controllers/fileController.js:323](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:323>) | `ActivityLog.create({...})` | Inserts a move activity log. |
| [controllers/fileController.js:368](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:368>) | `ActivityLog.create({...})` | Inserts a share/access-change activity log. |
| [controllers/groupController.js:59](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:59>) | `Group.create({...})` | Inserts a new group document. |
| [controllers/groupController.js:70](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:70>) | `ActivityLog.create({...})` | Inserts a group-created activity log. |
| [controllers/groupController.js:103](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:103>) | `ActivityLog.create({...})` | Inserts a group-member-added activity log. |
| [controllers/groupController.js:137](<c:/Users/parth/Desktop/DE project/main_project/controllers/groupController.js:137>) | `ActivityLog.create({...})` | Inserts a group-member-removed activity log. |

### Deletes

| Reference | Call | Explanation |
|---|---|---|
| [controllers/fileController.js:276](<c:/Users/parth/Desktop/DE project/main_project/controllers/fileController.js:276>) | `File.deleteOne({ _id: file._id })` | Deletes a file metadata document after the file has been removed from disk. |

### Connection and Session Storage

| Reference | Call | Explanation |
|---|---|---|
| [app.js:21](<c:/Users/parth/Desktop/DE project/main_project/app.js:21>) | `connectDb()` | Starts the app's database connection. |
| [app.js:41](<c:/Users/parth/Desktop/DE project/main_project/app.js:41>) | `MongoStore.create({ mongoUrl: process.env.MONGO_URI })` | Stores Express sessions in MongoDB. |
| [config/db.js:8](<c:/Users/parth/Desktop/DE project/main_project/config/db.js:8>) | `mongoose.set("strictQuery", true)` | Makes query filtering stricter in Mongoose. |
| [config/db.js:9](<c:/Users/parth/Desktop/DE project/main_project/config/db.js:9>) | `mongoose.connect(uri)` | Connects Mongoose to MongoDB. |

### Schemas, Indexes, and Models

| Reference | Call / part | Explanation |
|---|---|---|
| [models/User.js:3](<c:/Users/parth/Desktop/DE project/main_project/models/User.js:3>) | `new mongoose.Schema(...)` | Defines the `User` document structure. |
| [models/User.js:22](<c:/Users/parth/Desktop/DE project/main_project/models/User.js:22>) | `UserSchema.index({ userId: 1 })` | Speeds user lookup/search by `userId`. |
| [models/User.js:23](<c:/Users/parth/Desktop/DE project/main_project/models/User.js:23>) | `UserSchema.index({ email: 1 })` | Speeds login/registration lookup by email. |
| [models/User.js:25](<c:/Users/parth/Desktop/DE project/main_project/models/User.js:25>) | `mongoose.model("User", UserSchema)` | Creates the `User` model. |
| [models/Group.js:3](<c:/Users/parth/Desktop/DE project/main_project/models/Group.js:3>) | `new mongoose.Schema(...)` | Defines the `Group` document structure. |
| [models/Group.js:21](<c:/Users/parth/Desktop/DE project/main_project/models/Group.js:21>) | `GroupSchema.index({ owner: 1, name: 1 }, { unique: true })` | Prevents one owner from creating duplicate group names and speeds owner/name lookup. |
| [models/Group.js:22](<c:/Users/parth/Desktop/DE project/main_project/models/Group.js:22>) | `GroupSchema.index({ members: 1 })` | Speeds queries that find groups by member ID. |
| [models/Group.js:24](<c:/Users/parth/Desktop/DE project/main_project/models/Group.js:24>) | `mongoose.model("Group", GroupSchema)` | Creates the `Group` model. |
| [models/File.js:3](<c:/Users/parth/Desktop/DE project/main_project/models/File.js:3>) | `new mongoose.Schema(...)` | Defines the `File` document structure. |
| [models/File.js:32](<c:/Users/parth/Desktop/DE project/main_project/models/File.js:32>) | `FileSchema.index({ owner: 1, name: 1 })` | Speeds owner/name file lookup and sorting/filtering patterns. |
| [models/File.js:33](<c:/Users/parth/Desktop/DE project/main_project/models/File.js:33>) | `FileSchema.index({ "access.visibility": 1 })` | Speeds access visibility checks. |
| [models/File.js:34](<c:/Users/parth/Desktop/DE project/main_project/models/File.js:34>) | `FileSchema.index({ "access.allowedUsers": 1 })` | Speeds direct user-sharing queries. |
| [models/File.js:35](<c:/Users/parth/Desktop/DE project/main_project/models/File.js:35>) | `FileSchema.index({ "access.allowedGroups": 1 })` | Speeds group-sharing queries. |
| [models/File.js:36](<c:/Users/parth/Desktop/DE project/main_project/models/File.js:36>) | `FileSchema.index({ name: "text", tags: "text" })` | Enables text search across file names and tags. |
| [models/File.js:38](<c:/Users/parth/Desktop/DE project/main_project/models/File.js:38>) | `mongoose.model("File", FileSchema)` | Creates the `File` model. |
| [models/ActivityLog.js:3](<c:/Users/parth/Desktop/DE project/main_project/models/ActivityLog.js:3>) | `new mongoose.Schema(...)` | Defines the `ActivityLog` document structure. |
| [models/ActivityLog.js:14](<c:/Users/parth/Desktop/DE project/main_project/models/ActivityLog.js:14>) | `ActivityLogSchema.index({ actor: 1, createdAt: -1 })` | Speeds activity lookup by actor and recent time. |
| [models/ActivityLog.js:15](<c:/Users/parth/Desktop/DE project/main_project/models/ActivityLog.js:15>) | `ActivityLogSchema.index({ file: 1 })` | Speeds activity lookup by file. |
| [models/ActivityLog.js:17](<c:/Users/parth/Desktop/DE project/main_project/models/ActivityLog.js:17>) | `mongoose.model("ActivityLog", ActivityLogSchema)` | Creates the `ActivityLog` model. |
