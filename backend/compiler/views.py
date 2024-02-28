from __future__ import print_function
from datetime import datetime, timedelta
from django.http import Http404, JsonResponse, HttpResponse
from compiler.compilation.cpp_compilation import cppCompilation
from compiler.compilation.java_compilation import javaCompilation
from compiler.compilation.python_compilation import pythonCompilation
from .models import SignupToken, User, Problem, Submission, ForgotPasswordToken
from .serializers import ProblemSerializer, ProblemsSerializer, SubmissionSerializer, UserSerializer
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
import uuid
from rest_framework.decorators import api_view
import re
import bcrypt
from django.utils import timezone
from compiler.common.config import BASE_URL, FRONTEND_BASE_URL
import time
import calendar
import sib_api_v3_sdk
from sib_api_v3_sdk.rest import ApiException
from pprint import pprint
from .common.email_template import email_verification_html_template, forgot_password_html_template
from oj_test.settings import bcryptSalt, sendInBlueApiKey, jwtSecret
import jwt

# Create your views here.

emailRegex = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'


@api_view(['POST'])
def users(request):
    if request.method == "POST":
        body = JSONParser().parse(request)

        if "email" not in body or "password" not in body:
            return Response(
                status=400,
                data="Bad Request"
            )

        email = body["email"]
        password = body["password"]

        if not re.fullmatch(emailRegex, email):
            return Response(
                status=400,
                data="Invalid email address"
            )

        if len(password) < 6 or len(password) > 20:
            return Response(
                status=400,
                data="Password length should be between 6 - 20"
            )
        try:
            user = User.objects.get(email=email)
            return Response(
                status=400,
                data="Email already exists in record, please login or use new email"
            )
        except User.DoesNotExist:
            pass

        salt = str(bcryptSalt[1:])
        encoded_salt = salt.encode('utf-8')
        passwordEncoded = password.encode('utf-8')
        hashedPassword = bcrypt.hashpw(passwordEncoded, encoded_salt)
        hashedPassword = hashedPassword.decode('utf-8')

        user = User(
            email=email,
            password=hashedPassword,
            registeredOn=timezone.now(),
            isActive=False)
        user.save()

        tenminutes = timedelta(minutes=10)
        token = str(uuid.uuid1())

        registrationToken = SignupToken(
            token=token,
            expiration=timezone.now() + tenminutes,
            user=user
        )
        registrationToken.save()
        email_content = email_verification_html_template.format(BASE_URL, user.email, registrationToken.token)
        sendEmail("Email verification", email_content, user.email)
        return Response(data="User added successfully", status=201)


def signupVerification(request, email: str, token: str):
    # if email and token matches with existing record and still valid than make user active
    try:
        user = User.objects.get(email=email)
        record = SignupToken.objects.get(user=user, token=token)

        if record.expiration < timezone.now():
            record.delete()
            new_token = SignupToken(
                token=str(uuid.uuid1()),
                expiration=timezone.now() + timedelta(minutes=10),
                user=user
            )
            new_token.save()
            email_content = email_verification_html_template.format(BASE_URL, user.email, new_token.token)
            sendEmail("Email verification", email_content, user.email)
            return HttpResponse("Token expired, new link send on registered email address")

        user.isActive = True
        user.save()
        record.delete()

        return HttpResponse("Email verified successfully")

    except (User.DoesNotExist, SignupToken.DoesNotExist):
        return HttpResponse("User or token not found")


@api_view(['POST'])
def login(request):
    body = JSONParser().parse(request)
    if "email" not in body or "password" not in body:
        return Response(
            status=400,
            data="Invalid body"
        )

    encodedPassword = body["password"].encode('utf-8')
    user = None
    try:
        user = User.objects.get(email=body["email"])
    except User.DoesNotExist:
        return Response(
            status=404,
            data="No record found with matching email and password"
        )

    passw = user.password
    passw = passw.encode('utf-8')
    if bcrypt.checkpw(encodedPassword, passw):
        if not user.isActive:
            return Response(
                status=400,
                data="Email not verified, please verify email address than login"
            )
        # Create JWT and return it
        issuedAt = calendar.timegm(time.gmtime())
        expireAt = timezone.now() + timedelta(days=15)
        claim_jwt_payload = {
            "token_type": "access",
            "exp": calendar.timegm(expireAt.timetuple()),
            "iat": issuedAt,
            "jti": str(uuid.uuid1()),
            "user_id": user.id,
            "email": user.email
        }
        encoded_claim_jwt = jwt.encode(claim_jwt_payload, jwtSecret, algorithm="HS256")
        return Response(
            status=200,
            data={
                "token": encoded_claim_jwt
            }
        )
    else:
        return Response(
            status=404,
            data="No record found with matching email and password"
        )


@api_view(['POST'])
def forgotPassword(request):
    body = JSONParser().parse(request)
    if "email" not in body:
        return Response(
            status=400,
            data="Bad Request"
        )
    email = body["email"]

    try:
        user = User.objects.get(email=email)
        if not user.isActive:
            try:
                token = SignupToken.objects.get(user=user)
                token.delete()
            except SignupToken.DoesNotExist:
                pass
            new_token = SignupToken(
                token=str(uuid.uuid1()),
                expiration=timezone.now() + timedelta(minutes=10),
                user=user
            )
            new_token.save()
            email_content = email_verification_html_template.format(BASE_URL, user.email, new_token.token)
            sendEmail("Email verification", email_content, user.email)
            return Response(
                status=406,
                data="Email address not yet verified, sent a new link to verify email"
            )
        else:
            try:
                oldToken = ForgotPasswordToken.objects.get(user=user)
                oldToken.delete()
            except ForgotPasswordToken.DoesNotExist:
                pass
            forgotPass = ForgotPasswordToken(
                token=str(uuid.uuid1()),
                expiration=timezone.now() + timedelta(minutes=10),
                user=user
            )
            forgotPass.save()
            email_content = forgot_password_html_template.format(FRONTEND_BASE_URL, user.email, forgotPass.token)
            sendEmail("Create new password", email_content, user.email)
            return Response(
                status=201,
                data="Sent a link on registered email to reset password"
            )
    except User.DoesNotExist:
        return Response(
            status=406,
            data="Email doesn\'t exists in our record"
        )


@api_view(["POST"])
def forgotPasswordVerification(request, email, token):
    body = JSONParser().parse(request)
    if "newPassword" not in body:
        return Response(
            status=400,
            data="Bad Request"
        )
    try:
        user = User.objects.get(email=email)
        token = ForgotPasswordToken.objects.get(user=user, token=token)
        if token.expiration < timezone.now():
            token.delete()
            return Response(
                status=406,
                data="Token expired, please generate a new one"
            )
        encoded_password = body["newPassword"].encode('utf-8')
        salt = str(bcryptSalt[1:])
        encoded_salt = salt.encode('utf-8')
        hashed_password = bcrypt.hashpw(encoded_password, encoded_salt)
        hashed_password = hashed_password.decode('utf-8')
        user.password = hashed_password
        user.save()
        token.delete()
        return Response(
            status=200,
            data="Password successfully changed"
        )

    except (User.DoesNotExist, ForgotPasswordToken.DoesNotExist):
        return Response(
            status=404,
            data="Invalid token or email"
        )


def sendEmail(subject: str, html_content: str, to_email: str):
    configuration = sib_api_v3_sdk.Configuration()
    configuration.api_key['api-key'] = sendInBlueApiKey

    api_instance = sib_api_v3_sdk.TransactionalEmailsApi(sib_api_v3_sdk.ApiClient(configuration))
    subject = subject
    html_content = html_content
    sender = {"name": "Balaji Jangde", "email": "balajangde@gmail.com"}
    to = [{"email": to_email}]
    send_smtp_email = sib_api_v3_sdk.SendSmtpEmail(to=to,
                                                   html_content=html_content, sender=sender, subject=subject)
    try:
        api_response = api_instance.send_transac_email(send_smtp_email)
        pprint(api_response)
    except ApiException as e:
        print("Exception when calling SMTPApi->send_transac_email: %s\n" % e)


@api_view(['POST', 'GET'])
def submission(request, id):
    user_id = None
    try:
        user_id = validateAccessToken(request)
    except:
        return Response(status=401, data="Unauthorized or Invalid token")
    if request.method == "GET":
        user = User.objects.get(pk=user_id)
        problem = Problem.objects.get(pk=id)
        subs = Submission.objects.filter(user=user).filter(
            problem=problem).order_by('-submittedOn')
        serializer = SubmissionSerializer(subs, many=True)
        return JsonResponse(serializer.data, safe=False)
    elif request.method == "POST":
        try:
            problem = Problem.objects.get(pk=id)
        except Problem.DoesNotExist:
            return Response({
                "result": "Problem not found",
                "details": "Invalid question ID received"
            }, status=404)

        try:
            body = JSONParser().parse(request)
            codes = body['codes']
            language = body['language']
            if language not in ["cpp", "java", "python"] or codes == "":
                return Response({
                    "result": "Invalid body",
                    "details": "Invalid body provided"
                }, status=400)
        except:
            return Response({
                "result": "Invalid body",
                "details": "Invalid body provided"
            }, status=400)

        # TODO User is hardcoded, had to change this to dynamic user id
        user = User.objects.get(pk=user_id)

        if language == "cpp":
            return cppCompilation(problem, user, body)
        elif language == "java":
            return javaCompilation(problem, user, body)
        else:
            return pythonCompilation(problem, user, body)

@api_view(['GET'])
def submission_with_id(request, id):
    user_id = None
    try:
        user_id = validateAccessToken(request)
    except:
        return Response(status=401, data="Unauthorized or Invalid token")
    try:
        user = User.objects.get(pk=user_id)
        submission = Submission.objects.get(pk=id, user=user)
        serializer = SubmissionSerializer(submission, many=False)
        data = serializer.data
        codefile = open(submission.code, "r")
        codes = codefile.read()
        codefile.close()
        data["codes"] = codes
        return JsonResponse(data, safe=False)

    except Submission.DoesNotExist:
        return Response(status=404, data="Submission not found")


@api_view(['GET'])
def problems(request):
    data = Problem.objects.all()
    serializer = ProblemsSerializer(data, many=True)
    return JsonResponse(serializer.data, safe=False)


@api_view(['GET'])
def problem(request, id):
    try:
        validateAccessToken(request)
    except:
        return Response(status=401, data="Unauthorized or Invalid token")
    try:
        problem = Problem.objects.get(pk=id)
    except Problem.DoesNotExist:
        raise Http404("Problem not found")
    serializer = ProblemSerializer(problem)
    return JsonResponse(serializer.data, safe=False)


def validateAccessToken(request) -> int:
    try:
        token = request.headers["Authorization"].split(" ")[1]
        decoded_token = jwt.decode(token, jwtSecret, algorithms="HS256")
        return decoded_token["user_id"]
    except Exception as e:
        print(e)
        raise Exception("Unauthorized 401")
