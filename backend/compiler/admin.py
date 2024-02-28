from django.contrib import admin
from .models import ForgotPasswordToken, Problem, SignupToken, User, Submission
# Register your models here.
admin.site.register(Problem)
admin.site.register(User)
admin.site.register(Submission)
admin.site.register(SignupToken)
admin.site.register(ForgotPasswordToken)
