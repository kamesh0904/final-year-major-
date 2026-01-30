# NeuroNest GCP Deployment Checklist

## Pre-Deployment Requirements ✅

### 1. Accounts & Services Setup
- [ ] Google Cloud Platform account created
- [ ] Firebase project created
- [ ] Supabase project running
- [ ] OpenAI API key obtained
- [ ] Domain name registered (optional)

### 2. Local Development Environment
- [ ] Google Cloud CLI installed and authenticated
- [ ] Firebase CLI installed and authenticated
- [ ] Node.js 18+ installed
- [ ] Python 3.10+ installed
- [ ] Git repository set up

### 3. Environment Variables Prepared
- [ ] `SUPABASE_URL` - Your Supabase project URL
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- [ ] `SUPABASE_ANON_KEY` - Supabase anonymous key
- [ ] `OPENAI_API_KEY` - OpenAI API key
- [ ] `SECRET_KEY` - Application secret key

## Deployment Steps 🚀

### Phase 1: Project Setup
- [ ] Run `gcloud auth login`
- [ ] Run `firebase login`
- [ ] Create GCP project: `gcloud projects create neuronest-app`
- [ ] Enable required APIs (Cloud Run, Cloud Build, Container Registry)
- [ ] Initialize Firebase project: `firebase init`

### Phase 2: Database Migration
- [ ] Run Supabase migration: `SUPABASE_POST_GAME_MIGRATION.sql`
- [ ] Verify all tables created successfully
- [ ] Test database connection from local backend

### Phase 3: Backend Deployment
- [ ] Set environment variables in your shell:
  ```bash
  export SUPABASE_URL="your-supabase-url"
  export SUPABASE_SERVICE_ROLE_KEY="your-supabase-key"
  export OPENAI_API_KEY="your-openai-key"
  export SECRET_KEY="your-secret-key"
  ```
- [ ] Deploy backend: `./deploy.sh backend` or manual Cloud Run deployment
- [ ] Test backend health endpoint
- [ ] Verify API endpoints work correctly
- [ ] Check Cloud Run logs for any errors

### Phase 4: Frontend Configuration
- [ ] Update `frontend/.env.production` with backend URL
- [ ] Update CORS settings in backend with frontend URL
- [ ] Test API connectivity from frontend build

### Phase 5: Frontend Deployment
- [ ] Build frontend: `npm run build`
- [ ] Deploy to Firebase: `firebase deploy`
- [ ] Test frontend functionality
- [ ] Verify all features work in production

### Phase 6: Domain & SSL (Optional)
- [ ] Configure custom domain for backend (Cloud Run)
- [ ] Configure custom domain for frontend (Firebase Hosting)
- [ ] Update CORS settings with custom domains
- [ ] Test SSL certificates

## Post-Deployment Verification ✅

### Backend Health Checks
- [ ] Health endpoint responds: `GET /health`
- [ ] API endpoints work: `GET /`
- [ ] Database connection successful
- [ ] OpenAI integration working
- [ ] Authentication endpoints functional

### Frontend Functionality
- [ ] Application loads correctly
- [ ] User registration/login works
- [ ] Games load and function properly
- [ ] Session tracking works
- [ ] Questionnaires trigger correctly
- [ ] Reports generate and download
- [ ] Profile updates correctly

### Performance & Monitoring
- [ ] Set up Cloud Monitoring alerts
- [ ] Configure log aggregation
- [ ] Test application under load
- [ ] Monitor memory and CPU usage
- [ ] Set up error tracking

## Security Checklist 🔒

### Backend Security
- [ ] Environment variables secured (not in code)
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation implemented
- [ ] SQL injection protection verified

### Frontend Security
- [ ] API keys not exposed in frontend code
- [ ] HTTPS enforced
- [ ] Content Security Policy configured
- [ ] XSS protection enabled

## Monitoring & Maintenance 📊

### Set Up Monitoring
- [ ] Cloud Run metrics dashboard
- [ ] Firebase Hosting analytics
- [ ] Error rate alerts
- [ ] Performance monitoring
- [ ] Cost monitoring alerts

### Backup Strategy
- [ ] Database backup schedule
- [ ] Code repository backup
- [ ] Environment variables backup
- [ ] SSL certificates backup

## Troubleshooting Common Issues 🔧

### Backend Issues
- **Build failures**: Check Dockerfile and requirements.txt
- **Environment variables**: Verify all required vars are set
- **Database connection**: Check Supabase credentials
- **CORS errors**: Update allowed origins
- **Memory issues**: Increase Cloud Run memory allocation

### Frontend Issues
- **Build failures**: Check Node.js version and dependencies
- **API connection**: Verify backend URL in environment variables
- **Authentication**: Check Supabase configuration
- **Routing issues**: Verify Firebase hosting rewrites

### Performance Issues
- **Slow responses**: Check Cloud Run CPU/memory allocation
- **High costs**: Review usage patterns and optimize
- **Timeout errors**: Increase Cloud Run timeout settings

## Cost Optimization 💰

### Backend (Cloud Run)
- [ ] Set appropriate CPU and memory limits
- [ ] Configure auto-scaling settings
- [ ] Monitor request patterns
- [ ] Use minimum instances = 0 for cost savings

### Frontend (Firebase Hosting)
- [ ] Enable compression
- [ ] Optimize image sizes
- [ ] Use CDN caching effectively
- [ ] Monitor bandwidth usage

## Rollback Plan 🔄

### If Deployment Fails
1. **Backend rollback**: Deploy previous Cloud Run revision
2. **Frontend rollback**: Use Firebase Hosting version history
3. **Database rollback**: Restore from Supabase backup
4. **DNS rollback**: Revert domain settings if changed

### Emergency Contacts
- [ ] Document key personnel contacts
- [ ] Create incident response plan
- [ ] Set up monitoring alerts
- [ ] Prepare rollback procedures

## Success Criteria ✨

### Deployment is successful when:
- [ ] All health checks pass
- [ ] Users can register and login
- [ ] Games function correctly
- [ ] Session tracking works
- [ ] Reports generate properly
- [ ] Performance meets requirements
- [ ] Security measures are in place
- [ ] Monitoring is active

## Next Steps After Deployment 🎯

1. **User Testing**: Conduct thorough user acceptance testing
2. **Performance Tuning**: Optimize based on real usage patterns
3. **Feature Rollout**: Gradually enable new features
4. **Documentation**: Update user guides and API documentation
5. **Marketing**: Announce the launch to users
6. **Feedback Collection**: Set up user feedback mechanisms

---

## Quick Deployment Commands

```bash
# Full deployment
./deploy.sh all

# Backend only
./deploy.sh backend

# Frontend only
./deploy.sh frontend

# Setup project
./deploy.sh setup
```

## Support Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Supabase Documentation](https://supabase.com/docs)
- [NeuroNest GitHub Repository](https://github.com/your-username/neuronest)

---

**Remember**: Always test in a staging environment before deploying to production! 🚀