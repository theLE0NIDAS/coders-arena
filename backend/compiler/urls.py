from django.urls import path
from . import views
# from rest_framework_simplejwt.views import (TokenObtainPairView, TokenRefreshView)

urlpatterns = [
    # api
    path('problems', views.problems, name='problems'),
    path('problems/<int:id>', views.problem, name='problem'),
    path('problems/<int:id>/submission', views.submission, name="submission"),
    path('user', views.users, name='user'),
    path('signup_verification/<str:email>/<str:token>',
         views.signupVerification, name="signup verification"),
    path('login', views.login, name="login"),
    path('forgotPassword', views.forgotPassword, name="forgot password"),
    path('forgotPassword_verification/<str:email>/<str:token>',
         views.forgotPasswordVerification, name="forgot password verification"),
    path('submission/<int:id>', views.submission_with_id, name="submission with id")
    # path('token', TokenObtainPairView.as_view(), name="token_obtain_pair"),
    # path('token/refresh', TokenRefreshView.as_view(), name="token_refresh")
]
