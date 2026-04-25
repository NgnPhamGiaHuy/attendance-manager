# Cloud Functions Setup Guide

## Initial Setup

### 1. Install Dependencies
```bash
cd functions
npm install
```

This will install:
- `firebase-admin` - Firebase Admin SDK
- `firebase-functions` - Cloud Functions SDK
- `typescript` - TypeScript compiler
- `@types/node` - Node.js type definitions

### 2. Build Functions
```bash
npm run build
```

This compiles TypeScript to JavaScript in the `lib/` directory.

### 3. Verify Build
After running `npm run build`, you should see:
```
functions/
├── lib/
│   ├── index.js
│   ├── fanOutMarkAll.js
│   ├── scoringEngine.js
│   ├── retroactiveRecalculate.js
│   └── recalculateScoresForClass.js
└── ...
```

## Local Testing with Emulators

### 1. Install Firebase CLI (if not already installed)
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase (if not already done)
```bash
firebase init
```

Select:
- Functions
- Firestore
- Emulators

### 4. Start Emulators
```bash
cd functions
npm run serve
```

This starts:
- Functions emulator (default: http://localhost:5001)
- Firestore emulator (default: http://localhost:8080)

### 5. Test Functions Locally
You can now test the functions against the emulators:

**Test fanOutMarkAll trigger**:
1. Update a session document's `defaultStatusId` in the Firestore emulator
2. Watch the function logs for execution

**Test scoringEngine trigger**:
1. Create/update an attendance record in the Firestore emulator
2. Watch the function logs for score calculation

**Test callable functions**:
```javascript
// In your client code, configure to use emulators
import { connectFunctionsEmulator } from 'firebase/functions';
import { functions } from './firebase';

if (process.env.NODE_ENV === 'development') {
  connectFunctionsEmulator(functions, 'localhost', 5001);
}

// Then call the function
const result = await httpsCallable(functions, 'retroactiveRecalculate')({
  classId: 'test-class',
  statusId: 'status-1',
  newMultiplier: 0.8,
  newAbsenceWeight: 0.5
});
```

## Deployment

### 1. Deploy All Functions
```bash
firebase deploy --only functions
```

### 2. Deploy Specific Function
```bash
firebase deploy --only functions:fanOutMarkAll
firebase deploy --only functions:scoringEngine
firebase deploy --only functions:retroactiveRecalculate
firebase deploy --only functions:recalculateScoresForClass
```

### 3. View Deployment Status
```bash
firebase functions:list
```

## Monitoring

### View Logs
```bash
# All functions
firebase functions:log

# Specific function
firebase functions:log --only fanOutMarkAll

# Follow logs in real-time
firebase functions:log --follow
```

### Firebase Console
1. Go to Firebase Console
2. Select your project
3. Navigate to Functions
4. View metrics, logs, and health

## Troubleshooting

### Build Errors
If you see TypeScript errors:
```bash
cd functions
rm -rf node_modules lib
npm install
npm run build
```

### Emulator Connection Issues
If functions can't connect to Firestore emulator:
1. Check `firebase.json` configuration
2. Ensure emulators are running
3. Check firewall settings

### Deployment Errors
If deployment fails:
1. Check Firebase CLI version: `firebase --version`
2. Update if needed: `npm install -g firebase-tools`
3. Re-authenticate: `firebase login --reauth`
4. Check project permissions in Firebase Console

### Function Timeout
If functions timeout:
1. Check execution time in logs
2. Optimize queries (add Firestore indexes)
3. Reduce batch sizes
4. Consider increasing timeout in `firebase.json`

## Performance Optimization

### Firestore Indexes
Create indexes for common queries:

```javascript
// attendance_records
- classId, studentId
- sessionId
- classId, statusId

// enrollments
- classId, isActive
- classId, studentId

// sessions
- classId, isFinalized
```

Add these in Firebase Console → Firestore → Indexes

### Function Configuration
Adjust in `firebase.json`:
```json
{
  "functions": {
    "runtime": "nodejs18",
    "memory": "256MB",
    "timeoutSeconds": 60
  }
}
```

## Security

### Environment Variables
Store sensitive data in environment variables:
```bash
firebase functions:config:set someservice.key="THE API KEY"
```

Access in code:
```typescript
const apiKey = functions.config().someservice.key;
```

### IAM Permissions
Ensure Cloud Functions service account has necessary permissions:
- Firestore read/write
- Cloud Logging write

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Build functions: `npm run build`
3. ✅ Test locally with emulators: `npm run serve`
4. ✅ Deploy to production: `firebase deploy --only functions`
5. ✅ Monitor logs and metrics in Firebase Console

## Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Cloud Functions for Firebase Samples](https://github.com/firebase/functions-samples)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)
